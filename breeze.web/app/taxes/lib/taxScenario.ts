/**
 * Tax scenario math for the Taxes page: walks the federal bracket ladder for a
 * gross income (optionally reduced by pre-tax elections) and reports the tax
 * owed per bracket, plus FICA, so the UI can draw one bar per scenario.
 * Tables are injected (TaxYearTables) — sourced from the API's taxYearData query.
 */
import type { TaxBracketRow, TaxYearTables } from '../../future/types/tax';
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

export interface BracketLadderRow {
  rate: number;
  minimum: number;
  maximum: number | null;
  /** Taxable income inside this bracket. */
  used: number;
  /** Tax owed on the used portion. */
  tax: number;
  status: 'filled' | 'current' | 'ahead';
  /** For the current bracket: room left before the next rate applies. */
  remainingToNext: number | null;
  /** For future brackets: extra income needed to enter. */
  distanceToEnter: number | null;
}

/** Full bracket ladder against a taxable income: every bracket's range, how
 * much of it is filled, and the distance to each threshold. */
export function buildBracketLadder(
  taxableIncome: number,
  brackets: TaxBracketRow[],
): BracketLadderRow[] {
  return brackets.map((bracket) => {
    const width = bracket.maximum === null ? Infinity : bracket.maximum - bracket.minimum;
    const used = Math.max(0, Math.min(taxableIncome - bracket.minimum, width));
    const filled = Number.isFinite(width) && used >= width - 1e-9;
    const current = !filled && used > 0;
    const ahead = used <= 0;
    return {
      rate: bracket.rate,
      minimum: bracket.minimum,
      maximum: bracket.maximum,
      used,
      tax: used * bracket.rate,
      status: filled ? 'filled' : current ? 'current' : 'ahead',
      remainingToNext: current && Number.isFinite(width) ? width - used : null,
      distanceToEnter: ahead ? Math.max(0, bracket.minimum - taxableIncome) : null,
    };
  });
}

export interface ScenarioColumnRow {
  name: string;
  preTax: number;
  deduction: number;
  totalTax: number;
  effectiveRate: number;
  /** Income taxed at each bracket rate, keyed by percent (b10, b12, …). */
  [segment: string]: number | string;
}

/** Shape two scenarios into stacked-column rows: one row per scenario, one
 * segment per bracket rate present in either (union, ascending). Bracket
 * tax amounts ride along as `b{pct}Tax` for tooltips. */
export function buildScenarioColumns(
  baseline: TaxScenario,
  current: TaxScenario,
): { rates: number[]; rows: ScenarioColumnRow[] } {
  const rates = [
    ...new Set([...baseline.slices, ...current.slices].map((s) => s.rate)),
  ].sort((a, b) => a - b);

  const toRow = (scenario: TaxScenario): ScenarioColumnRow => {
    const row: ScenarioColumnRow = {
      name: scenario.label,
      preTax: scenario.pretaxReductions,
      deduction: scenario.deduction,
      totalTax: scenario.totalTax,
      effectiveRate: scenario.effectiveRate,
    };
    for (const rate of rates) {
      const slice = scenario.slices.find((s) => s.rate === rate);
      row[`b${rate * 100}`] = slice?.taxedAmount ?? 0;
      row[`b${rate * 100}Tax`] = slice?.tax ?? 0;
    }
    return row;
  };

  return { rates, rows: [toRow(baseline), toRow(current)] };
}
