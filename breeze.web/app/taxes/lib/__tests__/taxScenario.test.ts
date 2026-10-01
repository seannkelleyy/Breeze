import { describe, it, expect } from 'vitest';
import { buildBracketLadder, computeTaxScenario, householdPretaxReductions } from '../taxScenario';
import type { TaxYearTables, TaxBracketRow } from '../../../future/types/tax';
import type { PersonWaterfall } from '../../../future/lib/paycheck';

// 2026 single-filer-style ladder for tests: 10/12/22 with a $16,100 deduction.
const brackets: TaxBracketRow[] = [
  { minimum: 0, maximum: 12400, rate: 0.1 },
  { minimum: 12400, maximum: 50400, rate: 0.12 },
  { minimum: 50400, maximum: 105700, rate: 0.22 },
  { minimum: 105700, maximum: 201775, rate: 0.24 },
  { minimum: 201775, maximum: 256225, rate: 0.32 },
  { minimum: 256225, maximum: 640600, rate: 0.35 },
  { minimum: 640600, maximum: null, rate: 0.37 },
];
const tables: TaxYearTables = { year: 2026, brackets, standardDeduction: 16100, ssWageBase: 184500 };

describe('computeTaxScenario', () => {
  it('walks the brackets and sums slices to the taxable income', () => {
    const s = computeTaxScenario('base', 100000, 0, tables, 'STANDARD');
    expect(s.deduction).toBe(16100);
    expect(s.taxableIncome).toBe(83900);
    const sliceSum = s.slices.reduce((sum, x) => sum + x.taxedAmount, 0);
    expect(sliceSum).toBeCloseTo(83900, 6);
    expect(s.slices.map((x) => x.rate)).toEqual([0.1, 0.12, 0.22]);
    const bracketSum = s.slices.reduce((sum, x) => sum + x.tax, 0);
    expect(s.federalTax).toBeCloseTo(bracketSum, 6);
  });

  it('includes FICA on full gross in the total', () => {
    const s = computeTaxScenario('base', 100000, 0, tables, 'STANDARD');
    const fica = Math.min(100000, 184500) * 0.062 + 100000 * 0.0145;
    expect(s.ficaTax).toBeCloseTo(fica, 6);
    expect(s.totalTax).toBeCloseTo(s.federalTax + fica, 6);
    expect(s.effectiveRate).toBeCloseTo(s.totalTax / 100000, 6);
  });

  it('pre-tax reductions lower taxable income and can drop a bracket', () => {
    const base = computeTaxScenario('base', 100000, 0, tables, 'STANDARD');
    const reduced = computeTaxScenario('current', 100000, 35000, tables, 'STANDARD');
    expect(reduced.taxableIncome).toBe(base.taxableIncome - 35000);
    // 48,900 taxable drops from the 22% bracket into 12%.
    expect(reduced.marginalRate).toBe(0.12);
    expect(reduced.totalTax).toBeLessThan(base.totalTax);
  });

  it('floors taxable income at zero when reductions exceed gross', () => {
    const s = computeTaxScenario('maxed', 60000, 80000, tables, 'STANDARD');
    expect(s.taxableIncome).toBe(0);
    expect(s.federalTax).toBe(0);
    expect(s.slices).toEqual([]);
    expect(s.marginalRate).toBe(0.1);
  });

  it('uses no deduction when filing itemized', () => {
    const s = computeTaxScenario('itemized', 100000, 0, tables, 'ITEMIZED');
    expect(s.deduction).toBe(0);
    expect(s.taxableIncome).toBe(100000);
  });
});

describe('householdPretaxReductions', () => {
  it('annualizes pre-tax savings and withholdings from the waterfall', () => {
    const wf = {
      pretaxSavingsMonthly: 2000,
      pretaxWithholdingsMonthly: 250,
    } as PersonWaterfall;
    expect(householdPretaxReductions(wf)).toBe(27000);
  });
});

describe('buildBracketLadder', () => {
  const ladder = (taxable: number) => buildBracketLadder(taxable, brackets);

  it('marks past brackets filled, the active one current with room, and future ones ahead', () => {
    // 83,900 taxable: 10% and 12% fully filled, 22% active with room to 24%.
    const rows = ladder(83900);
    expect(rows[0].status).toBe('filled');
    expect(rows[1].status).toBe('filled');
    expect(rows[2].status).toBe('current');
    expect(rows[2].used).toBeCloseTo(83900 - 50400, 6);
    expect(rows[2].remainingToNext).toBeCloseTo(105700 - 83900, 6);
    expect(rows[3].status).toBe('ahead');
    expect(rows[3].distanceToEnter).toBeCloseTo(105700 - 83900, 6);
  });

  it('sums used across the ladder to the taxable income', () => {
    const rows = ladder(83900);
    expect(rows.reduce((sum, r) => sum + r.used, 0)).toBeCloseTo(83900, 6);
  });

  it('shows the top bracket as current with no next threshold', () => {
    const rows = ladder(700000);
    expect(rows[rows.length - 1].status).toBe('current');
    expect(rows[rows.length - 1].remainingToNext).toBeNull();
    expect(rows.every((r) => r.status !== 'ahead')).toBe(true);
  });
});

