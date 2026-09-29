/**
 * Tax scenario math for the Taxes page: walks the federal bracket ladder for a
 * gross income (optionally reduced by pre-tax elections) and reports the tax
 * owed per bracket, plus FICA, so the UI can draw one bar per scenario.
 * Tables are injected (TaxYearTables) — sourced from the API's taxYearData query.
 */
import type { TaxYearTables } from '../../future/types/tax';
import type { PersonWaterfall } from '../../future/lib/paycheck';

export interface BracketSlice {
  /** Marginal rate as a fraction (0.22 = 22%). */
  rate: number;
  /** Income taxed at this rate. */
  taxedAmount: number;
  /** Tax owed on this slice. */
  tax: number;
  /** Bracket bounds, for labels. */
  minimum: number;
  maximum: number | null;
}

export interface TaxScenario {
  label: string;
  grossIncome: number;
  /** Pre-tax 401(k)/HSA contributions + pre-tax withholdings. */
  pretaxReductions: number;
  deduction: number;
  taxableIncome: number;
  /** Bracket slices with taxedAmount > 0, in bracket order. */
  slices: BracketSlice[];
  federalTax: number;
  ficaTax: number;
  totalTax: number;
  effectiveRate: number;
  marginalRate: number;
}

/** Standard deduction unless the user files itemized (then $0 — itemization
 * isn't modeled line-by-line, so we don't guess an amount). */
const deductionFor = (tables: TaxYearTables, deductionType: string): number =>
  deductionType === 'ITEMIZED' ? 0 : tables.standardDeduction;

export function computeTaxScenario(
  label: string,
  grossIncome: number,
  pretaxReductions: number,
  tables: TaxYearTables,
  deductionType: string,
): TaxScenario {
  const deduction = deductionFor(tables, deductionType);
  const taxableIncome = Math.max(0, grossIncome - pretaxReductions - deduction);

  const slices: BracketSlice[] = [];
  let federalTax = 0;
  let marginalRate = tables.brackets[0]?.rate ?? 0;
  for (const bracket of tables.brackets) {
    if (taxableIncome <= bracket.minimum) break;
    const upper = bracket.maximum === null ? taxableIncome : Math.min(taxableIncome, bracket.maximum);
    const taxedAmount = upper - bracket.minimum;
    if (taxedAmount <= 0) continue;
    const tax = taxedAmount * bracket.rate;
    federalTax += tax;
    marginalRate = bracket.rate;
    slices.push({ rate: bracket.rate, taxedAmount, tax, minimum: bracket.minimum, maximum: bracket.maximum });
  }

  // FICA applies to full gross — consistent with the app's waterfall convention.
  const ficaTax =
    Math.min(grossIncome, tables.ssWageBase) * 0.062 + grossIncome * 0.0145;
  const totalTax = federalTax + ficaTax;

  return {
    label,
    grossIncome,
    pretaxReductions,
    deduction,
    taxableIncome,
    slices,
    federalTax,
    ficaTax,
    totalTax,
    effectiveRate: grossIncome > 0 ? totalTax / grossIncome : 0,
    marginalRate,
  };
}

/** Annual pre-tax reductions for the household: 401(k)/HSA contributions
 * (pre-tax share only) plus pre-tax withholdings, from the payroll waterfall. */
export function householdPretaxReductions(waterfall: PersonWaterfall): number {
  return (waterfall.pretaxSavingsMonthly + waterfall.pretaxWithholdingsMonthly) * 12;
}
