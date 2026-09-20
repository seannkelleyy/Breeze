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
