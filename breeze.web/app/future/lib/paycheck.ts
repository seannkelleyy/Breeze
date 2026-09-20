import type { PlannerPerson } from '../types/person';
import type { PlannerAccount } from '../types/account';
import type { TaxYearTables } from '../types/tax';
import { PAYROLL_SAVINGS_ACCOUNT_TYPES } from './config';
import { getEffectiveTaxRate } from './tax';
import {
  getEmployeeMonthlyContribution,
  getPaychecksPerYear,
  getPersonPaydaysForMonth,
} from './plannerMath';

/**
 * Monthly income waterfall for one person:
 *   gross − pre-tax savings − pre-tax withholdings = taxable
 *   → taxes (est.) = after-tax → − savings − post-tax withholdings = take-home
 *
 * Savings-type deductions (401(k), HSA) are account-backed: their contributions
 * come from the accounts system and never land in the bank. Pre-tax accounts
 * (401(k) traditional, HSA) reduce taxable income; Roth does not.
 * Insurance/FSA-type withholdings are non-saved: they reduce spendable income.
 */

export interface PaycheckWithholding {
  id: string;
  personId: string;
  name: string;
  /** Monthly amount. */
  amount: number;
  pretax: boolean;
  /** Category: INSURANCE, FSA, HSA, OTHER. */
  kind: string;
  /** Optional account the withheld money flows into (e.g. an HSA). */
  linkedAccountId: string | null;
}

export const WITHHOLDING_KIND_OPTIONS = [
  { value: 'INSURANCE', label: 'Insurance' },
  { value: 'FSA', label: 'FSA' },
  { value: 'HSA', label: 'HSA' },
  { value: 'OTHER', label: 'Other' },
] as const;

export interface PersonWaterfall {
  grossMonthly: number;
  /** 401(k)/HSA employee contributions (savings — never lands in the bank). */
  savingsMonthly: number;
  /** Savings into pre-tax accounts (reduce taxable income). */
  pretaxSavingsMonthly: number;
  /** Savings into Roth accounts (post-tax; do not reduce taxable income). */
  rothSavingsMonthly: number;
  /** Non-saved pre-tax withholdings (insurance, FSA…). */
  pretaxWithholdingsMonthly: number;
  /** Post-tax withholdings. */
  posttaxWithholdingsMonthly: number;
  taxableMonthly: number;
  effectiveRate: number;
  taxesMonthly: number;
  /** Gross minus taxes. */
  netAfterTaxesMonthly: number;
  /** What actually lands in the bank account each month. */
  takeHomeMonthly: number;
  /** Annual take-home. */
  takeHomeAnnual: number;
}

function isPretaxTreatment(account: PlannerAccount): boolean {
  return account.taxTreatment !== 'ROTH';
}

/**
 * Payroll-deducted savings accounts (401(k), 403(b), 457, HSA) owned by this
 * person. IRAs are excluded — they are not payroll-deducted.
 */
export function getPersonSavingsAccounts(
  person: PlannerPerson,
  accounts: PlannerAccount[],
): PlannerAccount[] {
  return accounts.filter(
    (a) => a.personIds.includes(person.id) && PAYROLL_SAVINGS_ACCOUNT_TYPES.has(a.accountType),
  );
}

/**
 * Employee contributions to payroll-deducted savings accounts (401(k), 403(b),
 * 457, HSA), split by tax treatment. IRAs are excluded — they are not
 * payroll-deducted.
 */
export function getPersonSavingsSplit(
  person: PlannerPerson,
  accounts: PlannerAccount[],
): { pretaxMonthly: number; rothMonthly: number } {
  let pretaxMonthly = 0;
  let rothMonthly = 0;
  for (const a of getPersonSavingsAccounts(person, accounts)) {
    if (isPretaxTreatment(a)) pretaxMonthly += getEmployeeMonthlyContribution(a, [person]);
    else rothMonthly += getEmployeeMonthlyContribution(a, [person]);
  }
  return { pretaxMonthly, rothMonthly };
}

export function computePersonWaterfall(
  person: PlannerPerson,
  accounts: PlannerAccount[],
  withholdings: PaycheckWithholding[],
  taxTables: TaxYearTables | null,
  deductionType: string,
): PersonWaterfall {
  const baseAnnual =
    person.payType === 'hourly'
      ? person.hourlyRate * person.expectedHoursPerWeek * 52
      : person.annualSalary;
  const grossMonthly = baseAnnual / 12;

  const { pretaxMonthly: pretaxSavingsMonthly, rothMonthly: rothSavingsMonthly } =
    getPersonSavingsSplit(person, accounts);
  const savingsMonthly = pretaxSavingsMonthly + rothSavingsMonthly;
  // Only this person's withholdings — callers may pass the whole household list.
  const personWithholdings = withholdings.filter((w) => w.personId === person.id);
  const pretaxWithholdingsMonthly = personWithholdings
    .filter((w) => w.pretax)
    .reduce((sum, w) => sum + w.amount, 0);
  const posttaxWithholdingsMonthly = personWithholdings
    .filter((w) => !w.pretax)
    .reduce((sum, w) => sum + w.amount, 0);

  // Pre-tax savings and withholdings reduce taxable income; Roth does not.
  const taxableMonthly = Math.max(
    0,
    grossMonthly - pretaxSavingsMonthly - pretaxWithholdingsMonthly,
  );
  const taxableAnnual = taxableMonthly * 12;
  // getEffectiveTaxRate returns a fraction (0.22 = 22%).
  const effectiveRate = taxTables
    ? getEffectiveTaxRate(taxableAnnual, taxTables, deductionType).effectiveRate
    : 1 - NEUTRAL_NET_FACTOR;
  const taxesMonthly = taxableMonthly * effectiveRate;

  const netAfterTaxesMonthly = grossMonthly - taxesMonthly;
  // Savings and post-tax withholdings leave the paycheck before it hits the bank.
  const takeHomeMonthly = netAfterTaxesMonthly - savingsMonthly - posttaxWithholdingsMonthly;

  return {
    grossMonthly,
    savingsMonthly,
    pretaxSavingsMonthly,
    rothSavingsMonthly,
    pretaxWithholdingsMonthly,
    posttaxWithholdingsMonthly,
    taxableMonthly,
    effectiveRate,
    taxesMonthly,
    netAfterTaxesMonthly,
    takeHomeMonthly,
    takeHomeAnnual: takeHomeMonthly * 12,
  };
}

const NEUTRAL_NET_FACTOR = 0.8;

export interface PayrollIncomeItem {
  personId: string;
  name: string;
  amount: number;
  /** YYYY-MM-DD */
  date: string;
}

/**
 * One income row per actual payday in the given month, per person, using the
 * net (take-home) per-check amount from the paycheck waterfall. This is what
 * budget months consume so planned income matches real paydays — including
 * three-check biweekly months.
 */
export function getMonthPayrollIncomes(
  people: PlannerPerson[],
  accounts: PlannerAccount[],
  withholdings: PaycheckWithholding[],
  taxTables: TaxYearTables | null,
  deductionType: string,
  year: number,
  month: number, // 1-based
): PayrollIncomeItem[] {
  const items: PayrollIncomeItem[] = [];
  for (const person of people) {
    const waterfall = computePersonWaterfall(person, accounts, withholdings, taxTables, deductionType);
    const checksPerYear = getPaychecksPerYear(person.payCadence);
    if (checksPerYear <= 0) continue;
    const netPerCheck = Math.round((waterfall.takeHomeAnnual / checksPerYear) * 100) / 100;

    for (const payday of getPersonPaydaysForMonth(person, year, month - 1)) {
      const pad = (n: number) => String(n).padStart(2, '0');
      items.push({
        personId: person.id,
        name: `${person.name || 'Household'} paycheck`,
        amount: netPerCheck,
        date: `${payday.getFullYear()}-${pad(payday.getMonth() + 1)}-${pad(payday.getDate())}`,
      });
    }
  }
  return items;
}

/**
 * Household-wide waterfall: the sum of every person's waterfall. The
 * effective rate is recomputed against the combined gross so the ratio stays
 * meaningful.
 */
export function computeHouseholdWaterfall(
  people: PlannerPerson[],
  accounts: PlannerAccount[],
  withholdings: PaycheckWithholding[],
  taxTables: TaxYearTables | null,
  deductionType: string,
): PersonWaterfall {
  const sum: PersonWaterfall = {
    grossMonthly: 0,
    savingsMonthly: 0,
    pretaxSavingsMonthly: 0,
    rothSavingsMonthly: 0,
    pretaxWithholdingsMonthly: 0,
    posttaxWithholdingsMonthly: 0,
    taxableMonthly: 0,
    effectiveRate: 0,
    taxesMonthly: 0,
    netAfterTaxesMonthly: 0,
    takeHomeMonthly: 0,
    takeHomeAnnual: 0,
  };

  for (const person of people) {
    const wf = computePersonWaterfall(person, accounts, withholdings, taxTables, deductionType);
    sum.grossMonthly += wf.grossMonthly;
    sum.savingsMonthly += wf.savingsMonthly;
    sum.pretaxSavingsMonthly += wf.pretaxSavingsMonthly;
    sum.rothSavingsMonthly += wf.rothSavingsMonthly;
    sum.pretaxWithholdingsMonthly += wf.pretaxWithholdingsMonthly;
    sum.posttaxWithholdingsMonthly += wf.posttaxWithholdingsMonthly;
    sum.taxableMonthly += wf.taxableMonthly;
    sum.taxesMonthly += wf.taxesMonthly;
    sum.netAfterTaxesMonthly += wf.netAfterTaxesMonthly;
    sum.takeHomeMonthly += wf.takeHomeMonthly;
    sum.takeHomeAnnual += wf.takeHomeAnnual;
  }
  sum.effectiveRate = sum.grossMonthly > 0 ? sum.taxesMonthly / sum.grossMonthly : 0;
  return sum;
}
