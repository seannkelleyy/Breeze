import { describe, it, expect } from 'vitest';
import { getFederalTax, getFicaTax, getEffectiveTaxRate } from '../plannerMath';

describe('getFederalTax', () => {
  describe('SINGLE filing status', () => {
    it('returns 0 for zero income', () => {
      expect(getFederalTax(0, 'SINGLE')).toBe(0);
    });

    it('taxes the 10% bracket correctly', () => {
      const tax = getFederalTax(10000, 'SINGLE');
      expect(tax).toBeCloseTo(1000, 2);
    });

    it('taxes across 10% and 12% brackets', () => {
      const tax = getFederalTax(20000, 'SINGLE');
      // 11925 * 0.10 + (20000 - 11925) * 0.12
      const expected = 11925 * 0.1 + (20000 - 11925) * 0.12;
      expect(tax).toBeCloseTo(expected, 2);
    });

    it('taxes across all brackets for high income', () => {
      const income = 500000;
      const tax = getFederalTax(income, 'SINGLE');
      // Manual calculation:
      // 11925 * 0.10 = 1192.50
      // (48475 - 11925) * 0.12 = 4386.00
      // (103350 - 48475) * 0.22 = 12072.50
      // (197300 - 103350) * 0.24 = 22548.00
      // (250525 - 197300) * 0.32 = 17032.00
      // (500000 - 250525) * 0.35 = 87316.25
      const expected =
        11925 * 0.1 +
        (48475 - 11925) * 0.12 +
        (103350 - 48475) * 0.22 +
        (197300 - 103350) * 0.24 +
        (250525 - 197300) * 0.32 +
        (500000 - 250525) * 0.35;
      expect(tax).toBeCloseTo(expected, 2);
    });

    it('taxes at the top bracket boundary', () => {
      const income = 626350;
      const tax = getFederalTax(income, 'SINGLE');
      // Should NOT include 37% bracket since max for 35% is 626350
      const expected =
        11925 * 0.1 +
        (48475 - 11925) * 0.12 +
        (103350 - 48475) * 0.22 +
        (197300 - 103350) * 0.24 +
        (250525 - 197300) * 0.32 +
        (626350 - 250525) * 0.35;
      expect(tax).toBeCloseTo(expected, 2);
    });

    it('includes 37% bracket above threshold', () => {
      const income = 700000;
      const tax = getFederalTax(income, 'SINGLE');
      const expected =
        11925 * 0.1 +
        (48475 - 11925) * 0.12 +
        (103350 - 48475) * 0.22 +
        (197300 - 103350) * 0.24 +
        (250525 - 197300) * 0.32 +
        (626350 - 250525) * 0.35 +
        (700000 - 626350) * 0.37;
      expect(tax).toBeCloseTo(expected, 2);
    });
  });

  describe('MFJ filing status', () => {
    it('taxes at the 10% bracket', () => {
      expect(getFederalTax(20000, 'MFJ')).toBeCloseTo(2000, 2);
    });

    it('taxes across brackets correctly', () => {
      const income = 100000;
      const tax = getFederalTax(income, 'MFJ');
      const expected = 23850 * 0.1 + (96950 - 23850) * 0.12 + (100000 - 96950) * 0.22;
      expect(tax).toBeCloseTo(expected, 2);
    });
  });

  describe('edge cases', () => {
    it('falls back to SINGLE for unknown filing status', () => {
      const taxUnknown = getFederalTax(50000, 'UNKNOWN');
      const taxSingle = getFederalTax(50000, 'SINGLE');
      expect(taxUnknown).toBeCloseTo(taxSingle, 2);
    });

    it('handles negative income as 0', () => {
      expect(getFederalTax(-10000, 'SINGLE')).toBe(0);
    });
  });
});

describe('getFicaTax', () => {
  it('returns 0 for zero income', () => {
    expect(getFicaTax(0)).toBe(0);
  });

  it('calculates standard FICA correctly', () => {
    const income = 100000;
    const tax = getFicaTax(income);
    // SS: 100000 * 0.062 = 6200
    // Medicare: 100000 * 0.0145 = 1450
    expect(tax).toBeCloseTo(7650, 2);
  });

  it('caps Social Security at wage base', () => {
    const income = 200000;
    const tax = getFicaTax(income);
    // SS: 176100 * 0.062 = 10918.20 (capped)
    // Medicare: 200000 * 0.0145 = 2900
    const expected = 176100 * 0.062 + 200000 * 0.0145;
    expect(tax).toBeCloseTo(expected, 2);
  });

  it('handles income exactly at SS wage base', () => {
    const income = 176100;
    const tax = getFicaTax(income);
    const expected = 176100 * 0.062 + 176100 * 0.0145;
    expect(tax).toBeCloseTo(expected, 2);
  });
});

describe('getEffectiveTaxRate', () => {
  it('returns 0 rate for zero income', () => {
    const result = getEffectiveTaxRate(0, 'SINGLE');
    expect(result.effectiveRate).toBe(0);
    expect(result.netIncomeFactor).toBe(1);
    expect(result.taxableIncome).toBe(0);
  });

  it('calculates effective rate for moderate income', () => {
    const result = getEffectiveTaxRate(100000, 'SINGLE');
    // Standard deduction: 15000
    // Taxable income: 85000
    expect(result.taxableIncome).toBe(85000);
    // Federal tax on 85000 SINGLE:
    // 11925 * 0.10 + (48475 - 11925) * 0.12 + (85000 - 48475) * 0.22
    const federalTax = 11925 * 0.1 + (48475 - 11925) * 0.12 + (85000 - 48475) * 0.22;
    const ficaTax = 100000 * 0.062 + 100000 * 0.0145;
    const expectedRate = (federalTax + ficaTax) / 100000;
    expect(result.effectiveRate).toBeCloseTo(expectedRate, 4);
    expect(result.netIncomeFactor).toBeCloseTo(1 - expectedRate, 4);
  });

  it('uses standard deduction by default', () => {
    const result = getEffectiveTaxRate(50000, 'SINGLE');
    expect(result.taxableIncome).toBe(35000); // 50000 - 15000
  });

  it('uses itemized deduction when specified', () => {
    const result = getEffectiveTaxRate(50000, 'SINGLE', 'ITEMIZED');
    expect(result.taxableIncome).toBe(50000); // no deduction
  });

  it('clamps taxable income to 0 for low income with standard deduction', () => {
    const result = getEffectiveTaxRate(10000, 'SINGLE');
    expect(result.taxableIncome).toBe(0); // 10000 - 15000 < 0
    // Still has FICA though
    expect(result.effectiveRate).toBeGreaterThan(0);
  });

  it('uses MFJ standard deduction for married filing jointly', () => {
    const result = getEffectiveTaxRate(100000, 'MFJ');
    expect(result.taxableIncome).toBe(70000); // 100000 - 30000
  });

  it('netIncomeFactor is always >= 0', () => {
    const result = getEffectiveTaxRate(1000000000, 'SINGLE');
    expect(result.netIncomeFactor).toBeGreaterThanOrEqual(0);
  });
});
