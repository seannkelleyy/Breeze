import { describe, it, expect } from 'vitest';
import { getMonthlyContribution, getAnnualIncomeWithGrowth } from '../plannerMath';

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
