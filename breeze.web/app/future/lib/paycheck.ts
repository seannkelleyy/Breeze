import type { PlannerPerson } from '../types/person';
import type { PlannerAccount } from '../types/account';
import type { TaxYearTables } from '../types/tax';
import { PAYROLL_SAVINGS_ACCOUNT_TYPES } from './config';
import { getFicaTax, getFederalTax } from './tax';
import {
  ADDITIONAL_MEDICARE_THRESHOLDS,
  FICA_EXEMPT_ACCOUNT_TYPES,
  withholdingTreatmentFor,
  WITHHOLDING_KIND_OPTIONS,
} from '@/lib/calc/payrollWages';
import {
  getEmployeeMonthlyContribution,
  getPaychecksPerYear,
  getPersonPaydaysForMonth,
} from './plannerMath';
import { getPersonBonusPerYear } from '@/lib/calc/income';

export { WITHHOLDING_KIND_OPTIONS };

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
  ficaExemptMonthly: number;
  ficaWagesAnnual: number;
  incomeTaxWagesAnnual: number;
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
/** Share (0–1) of an account's contribution that is pre-tax. A null share
 * falls back to the binary tax treatment; 1–99 splits the contribution. */
export function getPretaxShare(account: PlannerAccount): number {
  if (account.pretaxSharePercent != null) {
    return Math.min(100, Math.max(0, account.pretaxSharePercent)) / 100;
  }
  return isPretaxTreatment(account) ? 1 : 0;
}

export function getPersonSavingsSplit(
  person: PlannerPerson,
  accounts: PlannerAccount[],
): { pretaxMonthly: number; rothMonthly: number } {
  let pretaxMonthly = 0;
  let rothMonthly = 0;
  for (const a of getPersonSavingsAccounts(person, accounts)) {
    const monthly = getEmployeeMonthlyContribution(a, [person]);
    const share = getPretaxShare(a);
    pretaxMonthly += monthly * share;
    rothMonthly += monthly * (1 - share);
  }
  return { pretaxMonthly, rothMonthly };
}


/**
 * Splits one person's paycheck reductions by wage base:
 * - incomeTaxOnly: traditional deferrals + pretax withholdings without a
 *   §125 FICA exclusion (e.g. OTHER).
 * - ficaExempt: §125 items — HSA payroll contributions and pretax
 *   insurance/FSA withholdings — reduce BOTH bases.
 * Roth contributions reduce neither (returned implicitly as the remainder).
 */
export function splitWageReductions(
  person: PlannerPerson,
  accounts: PlannerAccount[],
  withholdings: PaycheckWithholding[],
): { incomeTaxOnlyMonthly: number; ficaExemptMonthly: number } {
  let incomeTaxOnly = 0;
  let ficaExempt = 0;
  for (const a of getPersonSavingsAccounts(person, accounts)) {
    const monthly = getEmployeeMonthlyContribution(a, [person]);
    // The pretax share reduces income-tax wages; it reduces FICA wages only
    // for cafeteria-plan (§125) accounts like the HSA. The Roth share
    // reduces neither — Roth deferrals are FICA-taxable wages.
    const share = getPretaxShare(a);
    incomeTaxOnly += monthly * share;
    if (FICA_EXEMPT_ACCOUNT_TYPES.has(a.accountType)) ficaExempt += monthly * share;
  }
  for (const w of withholdings.filter((x) => x.personId === person.id && x.pretax)) {
    const treatment = withholdingTreatmentFor(w.kind);
    if (treatment.fica) ficaExempt += w.amount;
    else incomeTaxOnly += w.amount;
  }
  return { incomeTaxOnlyMonthly: incomeTaxOnly, ficaExemptMonthly: ficaExempt };
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
  // Gross includes the full yearly bonus, averaged monthly — one canonical
  // household income everywhere (matches getTotalAnnualIncome).
  const grossMonthly = (baseAnnual + getPersonBonusPerYear(person)) / 12;

  const standardDeductionAnnual =
    deductionType === 'ITEMIZED' ? 0 : (taxTables?.standardDeduction ?? 0);
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

  // Per-deduction wage treatment: split the reductions by which wage base
  // they shrink (see lib/calc/payrollWages.ts). Traditional 401(k)-style
  // deferrals reduce income-tax wages only; §125 items (HSA, insurance,
  // FSA) reduce both; Roth reduces neither.
  const { incomeTaxOnlyMonthly, ficaExemptMonthly } = splitWageReductions(
    person,
    accounts,
    personWithholdings,
  );
  const incomeTaxWagesAnnual = Math.max(
    0,
    grossMonthly * 12 - incomeTaxOnlyMonthly * 12 - ficaExemptMonthly * 12 - standardDeductionAnnual,
  );
  const ficaWagesMonthly = Math.max(0, grossMonthly - ficaExemptMonthly);
  const ficaWagesAnnual = ficaWagesMonthly * 12;
  // getFederalTax walks the bracket ladder (0.22 = 22%); FICA is computed
  // per its own wage base — deferrals do not reduce it.
  const federalTaxAnnual = taxTables
    ? getFederalTax(incomeTaxWagesAnnual, taxTables.brackets)
    : 0;
  const ficaTaxAnnual = getFicaTax(ficaWagesAnnual, taxTables?.ssWageBase ?? 184500);
  const taxesAnnual = federalTaxAnnual + ficaTaxAnnual;
  const effectiveRate = grossMonthly > 0 ? taxesAnnual / (grossMonthly * 12) : 0;
  const taxesMonthly = taxesAnnual / 12;

  const netAfterTaxesMonthly = grossMonthly - taxesMonthly;
  // Savings and post-tax withholdings leave the paycheck before it hits the bank.
  const takeHomeMonthly = netAfterTaxesMonthly - savingsMonthly - posttaxWithholdingsMonthly;

  const incomeTaxWagesMonthly = Math.max(0, grossMonthly - incomeTaxOnlyMonthly - ficaExemptMonthly);
  return {
    grossMonthly,
    savingsMonthly,
    pretaxSavingsMonthly,
    rothSavingsMonthly,
    pretaxWithholdingsMonthly,
    posttaxWithholdingsMonthly,
    taxableMonthly: incomeTaxWagesMonthly,
    ficaExemptMonthly,
    ficaWagesAnnual,
    incomeTaxWagesAnnual,
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
    const waterfall = computePersonWaterfall(
      person,
      accounts,
      withholdings,
      taxTables,
      deductionType,
    );
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
    ficaExemptMonthly: 0,
    ficaWagesAnnual: 0,
    incomeTaxWagesAnnual: 0,
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
    sum.ficaExemptMonthly += wf.ficaExemptMonthly;
    sum.ficaWagesAnnual += wf.ficaWagesAnnual;
    sum.incomeTaxWagesAnnual += wf.incomeTaxWagesAnnual;
    sum.taxesMonthly += wf.taxesMonthly;
    sum.netAfterTaxesMonthly += wf.netAfterTaxesMonthly;
    sum.takeHomeMonthly += wf.takeHomeMonthly;
    sum.takeHomeAnnual += wf.takeHomeAnnual;
  }
  sum.effectiveRate = sum.grossMonthly > 0 ? sum.taxesMonthly / sum.grossMonthly : 0;

  // Additional Medicare Tax (0.9%) is a HOUSEHOLD-level check: it applies to
  // combined FICA wages above the filing-status threshold ($200k single/HOH,
  // $250k MFJ, $125k MFS — statutory, not indexed). Per-person waterfalls
  // never see it; the household step adds it to taxes and take-home.
  const threshold = ADDITIONAL_MEDICARE_THRESHOLDS[deductionType] ?? 200000;
  const additionalMedicareMonthly =
    Math.max(0, sum.ficaWagesAnnual - threshold) * 0.009 / 12;
  if (additionalMedicareMonthly > 0) {
    sum.taxesMonthly += additionalMedicareMonthly;
    sum.takeHomeMonthly -= additionalMedicareMonthly;
    sum.takeHomeAnnual -= additionalMedicareMonthly * 12;
    sum.effectiveRate = sum.grossMonthly > 0 ? sum.taxesMonthly / sum.grossMonthly : 0;
  }
  return sum;
}
