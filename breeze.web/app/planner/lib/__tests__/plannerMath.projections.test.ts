import { describe, it, expect } from 'vitest';
import {
  getMonthlyContribution,
  getYearsUntilGoalEstimate,
  getAnnualIncomeWithGrowth,
} from '../plannerMath';

describe('getMonthlyContribution', () => {
  it('returns 0 when target is 0', () => {
    expect(getMonthlyContribution(0, 0, 7, 30)).toBe(0);
  });

  it('returns full gap when no years provided', () => {
    expect(getMonthlyContribution(100000, 50000, 7)).toBe(50000);
  });

  it('returns full gap when years is 0', () => {
    expect(getMonthlyContribution(100000, 50000, 7, 0)).toBe(50000);
  });

  it('calculates with zero growth rate', () => {
    // Simple division: (100000 - 50000) / (10 * 12) = 416.67
    const result = getMonthlyContribution(100000, 50000, 0, 10);
    expect(result).toBeCloseTo(416.67, 0);
  });

  it('calculates PMT-like formula with positive rate', () => {
    const result = getMonthlyContribution(1000000, 0, 7, 30);
    // Should be a reasonable monthly savings amount
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(10000);
  });

  it('requires less monthly when starting balance is higher', () => {
    const fromZero = getMonthlyContribution(1000000, 0, 7, 30);
    const fromHalf = getMonthlyContribution(1000000, 500000, 7, 30);
    expect(fromHalf).toBeLessThan(fromZero);
  });

  it('returns 0 when start already exceeds target', () => {
    expect(getMonthlyContribution(100000, 200000, 7, 30)).toBe(0);
  });

  it('handles very small rate differences', () => {
    const result = getMonthlyContribution(100000, 0, 0.000001, 30);
    expect(result).toBeGreaterThan(0);
  });
});

describe('getYearsUntilGoalEstimate', () => {
  it('returns 0 when target is 0', () => {
    expect(getYearsUntilGoalEstimate(0, 50000, 1000, 7)).toBe(0);
  });

  it('returns 999 when no contributions', () => {
    expect(getYearsUntilGoalEstimate(1000000, 0, 0, 7)).toBe(999);
  });

  it('calculates with zero rate', () => {
    // (1000000 - 0) / (2000 * 12) = 41.67 -> ceil = 42
    const result = getYearsUntilGoalEstimate(1000000, 0, 2000, 0);
    expect(result).toBe(42);
  });

  it('returns fewer years with higher contributions', () => {
    const lowContrib = getYearsUntilGoalEstimate(500000, 0, 3000, 5);
    const highContrib = getYearsUntilGoalEstimate(500000, 0, 6000, 5);
    expect(highContrib).toBeLessThan(lowContrib);
    expect(highContrib).toBeGreaterThan(0);
  });

  it('returns fewer years with higher starting balance', () => {
    const fromZero = getYearsUntilGoalEstimate(500000, 0, 3000, 5);
    const fromHalf = getYearsUntilGoalEstimate(500000, 250000, 3000, 5);
    expect(fromHalf).toBeLessThan(fromZero);
  });

  it('returns reasonable estimates', () => {
    // $500k goal, $0 start, $3000/mo, 5% return ≈ ~11 years
    const years = getYearsUntilGoalEstimate(500000, 0, 3000, 5);
    expect(years).toBeGreaterThan(8);
    expect(years).toBeLessThan(15);
  });
});

describe('getAnnualIncomeWithGrowth', () => {
  it('returns base income with 0 growth', () => {
    expect(getAnnualIncomeWithGrowth(100000, 0, 5)).toBe(100000);
  });

  it('compounds growth correctly', () => {
    // 100000 * (1 + 0.03)^5 = 115927.41
    const result = getAnnualIncomeWithGrowth(100000, 3, 5);
    expect(result).toBeCloseTo(115927.41, 0);
  });

  it('returns base at year 0', () => {
    expect(getAnnualIncomeWithGrowth(100000, 5, 0)).toBe(100000);
  });

  it('handles negative growth', () => {
    const result = getAnnualIncomeWithGrowth(100000, -2, 5);
    expect(result).toBeLessThan(100000);
    expect(result).toBeCloseTo(90392.08, 0);
  });
});
