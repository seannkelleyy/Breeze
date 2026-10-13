import { describe, it, expect } from 'vitest';
import { buildConversionSuggestions } from '../tax';
import type { TaxBracketRow } from '../../types/tax';

// Simplified 2026-style single-filer table: 10% to 11,925; 12% to 48,475;
// 22% to 103,350. Standard deduction 15,000.
const brackets: TaxBracketRow[] = [
  { minimum: 0, maximum: 11925, rate: 0.1 },
  { minimum: 11925, maximum: 48475, rate: 0.12 },
  { minimum: 48475, maximum: 103350, rate: 0.22 },
  { minimum: 103350, maximum: null, rate: 0.24 },
];
const standardDeduction = 15000;

describe('buildConversionSuggestions', () => {
  it('fills the 12% bracket in retirement when other income is zero', () => {
    const rows = buildConversionSuggestions({
      currentYear: 2026,
      currentAge: 60,
      retirementAge: 60,
      annualSalary: 0,
      brackets,
      standardDeduction,
      pretaxBalance: 1000000,
      targetRate: 0.12,
      years: 3,
    });

    // Gross income must reach the 48,475 ceiling + the 15,000 deduction.
    for (const row of rows) {
      expect(row.conversion).toBeCloseTo(63475, 6);
      expect(row.otherTaxableIncome).toBe(0);
      expect(row.marginalRate).toBeCloseTo(0.12, 6);
      // Taxable income lands exactly at the 48,475 ceiling.
      expect(row.federalTax).toBeCloseTo(1192.5 + (48475 - 11925) * 0.12, 6);
    }
  });

  it('suggests nothing while salary already passes the ceiling', () => {
    const rows = buildConversionSuggestions({
      currentYear: 2026,
      currentAge: 50,
      retirementAge: 60,
      annualSalary: 70000,
      brackets,
      standardDeduction,
      pretaxBalance: 500000,
      targetRate: 0.12,
      years: 15,
    });

    // Working years (ages 50-60) have salary above the 63,475 gross ceiling.
    for (const row of rows.filter((r) => r.age <= 60)) {
      expect(row.conversion).toBe(0);
    }
    // Retirement years convert.
    expect(rows.find((r) => r.age === 61)?.conversion).toBeCloseTo(63475, 6);
  });

  it('converts only the headroom between salary and the ceiling', () => {
    const rows = buildConversionSuggestions({
      currentYear: 2026,
      currentAge: 55,
      retirementAge: 70,
      annualSalary: 30000,
      brackets,
      standardDeduction,
      pretaxBalance: 1000000,
      targetRate: 0.12,
      years: 3,
    });

    // 48,475 + 15,000 − 30,000 = 33,475 gross while still working; taxable
    // lands exactly at the ceiling.
    expect(rows[0].conversion).toBeCloseTo(33475, 6);
    expect(rows[0].otherTaxableIncome).toBe(30000);
    expect(rows[0].marginalRate).toBeCloseTo(0.12, 6);
  });

  it('stops converting once the pre-tax balance is exhausted', () => {
    const rows = buildConversionSuggestions({
      currentYear: 2026,
      currentAge: 60,
      retirementAge: 60,
      annualSalary: 0,
      brackets,
      standardDeduction,
      pretaxBalance: 40000,
      targetRate: 0.12,
      years: 3,
    });

    expect(rows[0].conversion).toBeCloseTo(40000, 6);
    expect(rows[1].conversion).toBe(0);
    expect(rows[2].conversion).toBe(0);
  });

  it('returns no rows for an unknown target rate', () => {
    const rows = buildConversionSuggestions({
      currentYear: 2026,
      currentAge: 60,
      retirementAge: 60,
      annualSalary: 0,
      brackets,
      standardDeduction,
      pretaxBalance: 100000,
      targetRate: 0.5,
      years: 3,
    });
    expect(rows).toHaveLength(0);
  });
});
