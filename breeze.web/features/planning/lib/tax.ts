/**
 * Federal tax brackets, FICA, and effective-rate computations.
 * All tables are injected (TaxYearTables) — sourced from the API's taxYearData query.
 */
import type { TaxBracketRow, TaxYearTables } from '../types/tax';
import type { FinancialMathSnapshot } from '../types/finance';
import type { PersonWaterfall } from './paycheck';
import * as plannerConstants from './constants';

export const getFederalTax = (taxableIncome: number, brackets: TaxBracketRow[]): number => {
  let tax = 0;
  for (const bracket of brackets) {
    if (taxableIncome <= bracket.minimum) break;
    const upper =
      bracket.maximum === null ? taxableIncome : Math.min(taxableIncome, bracket.maximum);
    tax += (upper - bracket.minimum) * bracket.rate;
  }
  return tax;
};

export const getFicaTax = (income: number, ssWageBase: number): number => {
  const ssTax = Math.min(income, ssWageBase) * 0.062;
  const medicareTax = income * 0.0145;
  return ssTax + medicareTax;
};

export const getEffectiveTaxRate = (
  grossIncome: number,
  tables: TaxYearTables,
  deductionType?: string,
): { effectiveRate: number; netIncomeFactor: number; taxableIncome: number } => {
  const deduction = deductionType === 'ITEMIZED' ? 0 : tables.standardDeduction;
  const taxableIncome = Math.max(0, grossIncome - deduction);
  const federalTax = getFederalTax(taxableIncome, tables.brackets);
  const ficaTax = getFicaTax(grossIncome, tables.ssWageBase);
  const totalTax = federalTax + ficaTax;
  const effectiveRate = grossIncome > 0 ? totalTax / grossIncome : 0;
  return {
    effectiveRate,
    netIncomeFactor: Math.max(0, 1 - effectiveRate),
    taxableIncome,
  };
};

export const getFinancialMathSnapshot = (
  input: Record<string, unknown>,
  taxTables: TaxYearTables | null,
  waterfall?: PersonWaterfall,
): FinancialMathSnapshot => {
  const monthlyExpenses = Number(input.monthlyExpenses ?? 0);
  const selfSalary = Number(input.selfSalary ?? 0);
  const spouseSalary = Number(input.spouseSalary ?? 0);
  const safeWithdrawalRate = Number(input.safeWithdrawalRate ?? 4);
  const currentPortfolio = Number(input.currentPortfolio ?? 0);
  const emergencyFundBalance = Number(input.emergencyFundBalance ?? 0);
  const deductionType = String(input.deductionType ?? 'STANDARD');
  const grossIncome = selfSalary + spouseSalary;
  const annualSpend = monthlyExpenses * 12;
  // While tax reference data is loading, fall back to a neutral factor
  // instead of blocking the whole projection on the fetch.
  // When the real paycheck waterfall is available, after-tax income and
  // savings capacity come from it (it accounts for pre-tax savings and
  // withholdings); otherwise fall back to a flat effective-rate estimate.
  const netIncomeFactor = waterfall
    ? waterfall.grossMonthly > 0
      ? 1 - waterfall.taxesMonthly / waterfall.grossMonthly
      : plannerConstants.PLANNER_NEUTRAL_NET_INCOME_FACTOR
    : taxTables
      ? getEffectiveTaxRate(grossIncome, taxTables, deductionType).netIncomeFactor
      : plannerConstants.PLANNER_NEUTRAL_NET_INCOME_FACTOR;
  const netIncome = waterfall
    ? (waterfall.grossMonthly - waterfall.taxesMonthly) * 12
    : grossIncome * netIncomeFactor;
  const annualExtraExpenseBuffer =
    annualSpend * (plannerConstants.PLANNER_ANNUAL_EXTRA_EXPENSE_BUFFER_PERCENT / 100);
  const yearlySavings = Math.max(
    0,
    (waterfall ? waterfall.takeHomeAnnual : netIncome) - annualSpend - annualExtraExpenseBuffer,
  );
  const withdrawalMultiplier = safeWithdrawalRate > 0 ? 1 / (safeWithdrawalRate / 100) : 25;
  const yearlyPortfolioIncome = currentPortfolio * (safeWithdrawalRate / 100);
  return {
    monthlyExpenses,
    annualSpend,
    emergencyFundBalance,
    emergencyFund3Months: monthlyExpenses * 3,
    emergencyFund6Months: monthlyExpenses * 6,
    emergencyFund12Months: monthlyExpenses * 12,
    selfSalary,
    spouseSalary,
    grossIncome,
    netIncomeFactor,
    netIncome,
    annualExtraExpenseBuffer,
    yearlySavings,
    safeWithdrawalRatePercent: safeWithdrawalRate,
    withdrawalMultiplier,
    currentPortfolio,
    yearlyPortfolioIncome,
    yearsToGoalRatePercent: 0,
    scenarios: [],
    payroll: waterfall,
  };
};

// ─── Bracket-fill Roth conversion suggestions ─────────────

export interface ConversionSuggestionInput {
  currentYear: number;
  /** Primary's age in the current year. */
  currentAge: number;
  /** Salary stops after this age — the conversion window opens up. */
  retirementAge: number;
  /** Household other taxable income while working (today's dollars). */
  annualSalary: number;
  /** Current-year federal brackets and standard deduction. */
  brackets: TaxBracketRow[];
  standardDeduction: number;
  /** Pre-tax dollars available to convert. */
  pretaxBalance: number;
  /** Fill brackets up to and including this marginal rate (e.g. 0.12). */
  targetRate: number;
  /** How many years to suggest for (default 15). */
  years?: number;
}

export interface ConversionSuggestionRow {
  year: number;
  age: number;
  /** Other taxable income already filling the brackets that year. */
  otherTaxableIncome: number;
  /** Suggested Traditional → Roth conversion for the year. */
  conversion: number;
  /** Marginal bracket rate after the conversion. */
  marginalRate: number;
  /** Federal tax on other income + the conversion (after standard deduction). */
  federalTax: number;
}

// Filling "the 12% bracket" means staying at or below its ceiling — so the
// target rate must match a bracket exactly, and the top (uncapped) bracket
// has no ceiling to fill.
const bracketCeilingForRate = (brackets: TaxBracketRow[], targetRate: number): number | null => {
  const target = brackets.find((bracket) => Math.abs(bracket.rate - targetRate) < 1e-9);
  return target && target.maximum !== null ? target.maximum : null;
};

const rateAtTaxableIncome = (brackets: TaxBracketRow[], taxableIncome: number): number => {
  let rate = brackets[0]?.rate ?? 0;
  for (const bracket of brackets) {
    if (taxableIncome > bracket.minimum) rate = bracket.rate;
    if (bracket.maximum !== null && taxableIncome <= bracket.maximum) break;
  }
  return rate;
};

/**
 * How much to convert from pre-tax to Roth each year to fill (but not leave)
 * the target tax bracket: `ceiling − standard deduction − other income`,
 * capped by the pre-tax balance and never negative. Years with no headroom —
 * working years whose salary already reaches the ceiling — suggest nothing.
 * Uses today's brackets for future years and assumes no other retirement
 * income besides the conversions themselves.
 */
export const buildConversionSuggestions = (
  input: ConversionSuggestionInput,
): ConversionSuggestionRow[] => {
  const {
    currentYear,
    currentAge,
    retirementAge,
    annualSalary,
    brackets,
    standardDeduction,
    pretaxBalance,
    targetRate,
    years = 15,
  } = input;

  const ceiling = bracketCeilingForRate(brackets, targetRate);
  if (ceiling === null || brackets.length === 0) return [];

  // The ceiling caps taxable income, so gross conversion headroom is
  // ceiling + standard deduction − other gross income.
  const grossCeiling = ceiling + standardDeduction;
  let remaining = Math.max(0, pretaxBalance);

  const rows: ConversionSuggestionRow[] = [];
  for (let offset = 0; offset < years; offset++) {
    const age = currentAge + offset;
    const other = age <= retirementAge ? annualSalary : 0;
    const conversion = Math.max(0, Math.min(grossCeiling - other, remaining));
    remaining -= conversion;

    const taxableIncome = Math.max(0, other + conversion - standardDeduction);
    rows.push({
      year: currentYear + offset,
      age,
      otherTaxableIncome: other,
      conversion,
      marginalRate: rateAtTaxableIncome(brackets, taxableIncome),
      federalTax: getFederalTax(taxableIncome, brackets),
    });
  }
  return rows;
};
