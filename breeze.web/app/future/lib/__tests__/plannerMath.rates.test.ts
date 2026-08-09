import { describe, it, expect } from 'vitest';
import {
  getRealAnnualRatePercent,
  getEffectiveAnnualRatePercent,
  getNominalAnnualRatePercentFromReal,
  getSuggestedSafeWithdrawalRate,
  getAccountAnnualRateFromProfile,
  getAccountRateProfileFromAnnualRate,
} from '../plannerMath';

describe('getRealAnnualRatePercent', () => {
  it('returns nominal rate when inflation is 0', () => {
    expect(getRealAnnualRatePercent(7, 0)).toBeCloseTo(7, 4);
  });

  it('adjusts for inflation correctly', () => {
    // (1 + 0.07) / (1 + 0.025) - 1 = 0.0439...
    const result = getRealAnnualRatePercent(7, 2.5);
    expect(result).toBeCloseTo(4.3902, 2);
  });

  it('returns negative real rate when inflation exceeds nominal', () => {
    const result = getRealAnnualRatePercent(2, 5);
    expect(result).toBeLessThan(0);
  });

  it('returns nominal when inflation is 100%', () => {
    expect(getRealAnnualRatePercent(7, 100)).toBe(7);
  });

  it('handles zero nominal rate', () => {
    const result = getRealAnnualRatePercent(0, 2.5);
    // (1 + 0) / (1 + 0.025) - 1 = -0.02439...
    expect(result).toBeCloseTo(-2.439, 2);
  });
});

describe('getNominalAnnualRatePercentFromReal', () => {
  it('is the inverse of getRealAnnualRatePercent (returns decimal, not percent)', () => {
    const nominal = 7;
    const inflation = 2.5;
    const real = getRealAnnualRatePercent(nominal, inflation);
    const recovered = getNominalAnnualRatePercentFromReal(real, inflation);
    // Note: getNominalAnnualRatePercentFromReal returns decimal (0.07), not percent (7)
    expect(recovered).toBeCloseTo(0.07, 4);
  });

  it('returns real rate when inflation is 100%', () => {
    expect(getNominalAnnualRatePercentFromReal(5, 100)).toBe(5);
  });

  it('handles zero inflation', () => {
    // (1 + 7/100) * (1 + 0) - 1 = 0.07
    expect(getNominalAnnualRatePercentFromReal(7, 0)).toBeCloseTo(0.07, 4);
  });
});

describe('getEffectiveAnnualRatePercent', () => {
  it('returns nominal rate when useInflationAdjusted is false', () => {
    expect(getEffectiveAnnualRatePercent(7, 2.5, false)).toBe(7);
  });

  it('returns real rate when useInflationAdjusted is true', () => {
    const expected = getRealAnnualRatePercent(7, 2.5);
    expect(getEffectiveAnnualRatePercent(7, 2.5, true)).toBeCloseTo(expected, 4);
  });
});

describe('getSuggestedSafeWithdrawalRate', () => {
  it('returns 4.5% for short horizons (< 30 years)', () => {
    expect(getSuggestedSafeWithdrawalRate(20)).toBe(4.5);
    expect(getSuggestedSafeWithdrawalRate(29)).toBe(4.5);
  });

  it('returns 4.0% for 30-39 year horizons', () => {
    expect(getSuggestedSafeWithdrawalRate(30)).toBe(4.0);
    expect(getSuggestedSafeWithdrawalRate(39)).toBe(4.0);
  });

  it('returns 3.5% for 40-49 year horizons', () => {
    expect(getSuggestedSafeWithdrawalRate(40)).toBe(3.5);
    expect(getSuggestedSafeWithdrawalRate(49)).toBe(3.5);
  });

  it('returns 3.25% for 50-59 year horizons', () => {
    expect(getSuggestedSafeWithdrawalRate(50)).toBe(3.25);
  });

  it('returns 3.0% for 60+ year horizons', () => {
    expect(getSuggestedSafeWithdrawalRate(60)).toBe(3.0);
    expect(getSuggestedSafeWithdrawalRate(80)).toBe(3.0);
  });
});

describe('getAccountAnnualRateFromProfile', () => {
  it('returns 0 for none profile', () => {
    expect(getAccountAnnualRateFromProfile('none', 0, 2.5, false)).toBe(0);
  });

  it('returns 3 for money-market profile', () => {
    expect(getAccountAnnualRateFromProfile('money-market', 0, 2.5, false)).toBe(3);
  });

  it('returns 4 for bonds profile', () => {
    expect(getAccountAnnualRateFromProfile('bonds', 0, 2.5, false)).toBe(4);
  });

  it('returns 7 for stock-bond-mix profile', () => {
    expect(getAccountAnnualRateFromProfile('stock-bond-mix', 0, 2.5, false)).toBe(7);
  });

  it('returns 10 for stocks profile', () => {
    expect(getAccountAnnualRateFromProfile('stocks', 0, 2.5, false)).toBe(10);
  });

  it('returns custom rate when profile is custom', () => {
    expect(getAccountAnnualRateFromProfile('custom', 8.5, 2.5, false)).toBe(8.5);
  });

  it('converts custom rate from real to nominal when useInflationAdjusted', () => {
    const result = getAccountAnnualRateFromProfile('custom', 5, 2.5, true);
    const expected = getNominalAnnualRatePercentFromReal(5, 2.5);
    expect(result).toBeCloseTo(expected, 4);
  });
});

describe('getAccountRateProfileFromAnnualRate', () => {
  it('returns none for rates <= 1.5%', () => {
    expect(getAccountRateProfileFromAnnualRate(0, 2.5, false)).toBe('none');
    expect(getAccountRateProfileFromAnnualRate(1.5, 2.5, false)).toBe('none');
  });

  it('returns money-market for rates 1.5-3.5%', () => {
    expect(getAccountRateProfileFromAnnualRate(2, 2.5, false)).toBe('money-market');
    expect(getAccountRateProfileFromAnnualRate(3, 2.5, false)).toBe('money-market');
  });

  it('returns bonds for rates 3.5-5.5%', () => {
    expect(getAccountRateProfileFromAnnualRate(4, 2.5, false)).toBe('bonds');
  });

  it('returns stock-bond-mix for rates 5.5-8.5%', () => {
    expect(getAccountRateProfileFromAnnualRate(7, 2.5, false)).toBe('stock-bond-mix');
  });

  it('returns stocks for rates 8.5-10%', () => {
    expect(getAccountRateProfileFromAnnualRate(10, 2.5, false)).toBe('stocks');
  });

  it('returns custom for rates > 10%', () => {
    expect(getAccountRateProfileFromAnnualRate(12, 2.5, false)).toBe('custom');
  });
});
