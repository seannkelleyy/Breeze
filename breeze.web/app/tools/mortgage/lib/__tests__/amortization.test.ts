import { describe, it, expect } from 'vitest';
import {
  clamp,
  calculateMonthlyPayment,
  buildAmortization,
  loanPaidDownPercent,
  computeRefinanceNpv,
  computeBreakEvenMonths,
} from '../amortization';

describe('clamp', () => {
  it('returns the value when above min', () => {
    expect(clamp(10, 0)).toBe(10);
  });

  it('returns min when value is below', () => {
    expect(clamp(-5, 0)).toBe(0);
  });

  it('returns min for NaN', () => {
    expect(clamp(NaN, 0)).toBe(0);
  });

  it('returns min for Infinity', () => {
    expect(clamp(Infinity, 0)).toBe(0);
  });

  it('uses 0 as default min', () => {
    expect(clamp(-10)).toBe(0);
  });

  it('respects custom min', () => {
    expect(clamp(5, 10)).toBe(10);
  });
});

describe('calculateMonthlyPayment', () => {
  it('calculates standard 30-year mortgage payment', () => {
    // $400,000 at 6.5% for 30 years
    const payment = calculateMonthlyPayment(400000, 6.5, 360);
    // Expected ~$2,528.27
    expect(payment).toBeCloseTo(2528.27, 0);
  });

  it('calculates 15-year mortgage payment', () => {
    // $400,000 at 6.5% for 15 years
    const payment = calculateMonthlyPayment(400000, 6.5, 180);
    // Higher payment than 30-year
    expect(payment).toBeGreaterThan(2528);
    expect(payment).toBeCloseTo(3484.43, 0);
  });

  it('handles 0% interest rate', () => {
    const payment = calculateMonthlyPayment(120000, 0, 120);
    expect(payment).toBeCloseTo(1000, 2);
  });

  it('returns 0 for 0 principal', () => {
    expect(calculateMonthlyPayment(0, 6.5, 360)).toBe(0);
  });

  it('clamps negative principal to 0', () => {
    expect(calculateMonthlyPayment(-100000, 6.5, 360)).toBe(0);
  });

  it('handles very short term', () => {
    const payment = calculateMonthlyPayment(12000, 6, 1);
    expect(payment).toBeCloseTo(12060, 0); // 12000 + 1 month of interest
  });
});

describe('buildAmortization', () => {
  it('generates correct number of rows for a standard loan', () => {
    // Use the exact PMT value for a $100k, 6%, 30-year loan
    const payment = calculateMonthlyPayment(100000, 6, 360);
    const summary = buildAmortization(100000, 6, payment, new Date('2025-01-01'));
    expect(summary.monthsToPayoff).toBe(360);
    expect(summary.rows).toHaveLength(360);
  });

  it('final balance is 0', () => {
    const summary = buildAmortization(100000, 6, 599.55, new Date('2025-01-01'));
    const lastRow = summary.rows[summary.rows.length - 1];
    expect(lastRow.balance).toBeCloseTo(0, 0);
  });

  it('total interest is positive', () => {
    const summary = buildAmortization(100000, 6, 599.55, new Date('2025-01-01'));
    expect(summary.totalInterest).toBeGreaterThan(0);
    // For a $100k loan at 6% over 30 years, total interest ~$115,838
    expect(summary.totalInterest).toBeGreaterThan(100000);
    expect(summary.totalInterest).toBeLessThan(130000);
  });

  it('first row has correct interest', () => {
    const summary = buildAmortization(100000, 6, 599.55, new Date('2025-01-01'));
    const firstRow = summary.rows[0];
    // Interest = 100000 * 0.06 / 12 = 500
    expect(firstRow.interest).toBeCloseTo(500, 2);
  });

  it('first row principal is payment minus interest', () => {
    const summary = buildAmortization(100000, 6, 599.55, new Date('2025-01-01'));
    const firstRow = summary.rows[0];
    expect(firstRow.principal).toBeCloseTo(firstRow.payment - firstRow.interest, 2);
  });

  it('detects negative amortization', () => {
    // Payment too low to cover interest
    const summary = buildAmortization(100000, 6, 100, new Date('2025-01-01'));
    expect(summary.isNegativeAmortization).toBe(true);
    expect(summary.rows).toHaveLength(0);
  });

  it('applies one-time extra payment', () => {
    const without = buildAmortization(100000, 6, 599.55, new Date('2025-01-01'));
    const withExtra = buildAmortization(100000, 6, 599.55, new Date('2025-01-01'), 10000);
    expect(withExtra.monthsToPayoff).toBeLessThan(without.monthsToPayoff);
  });

  it('applies recurring extra payment', () => {
    const without = buildAmortization(100000, 6, 599.55, new Date('2025-01-01'));
    const withExtra = buildAmortization(100000, 6, 599.55, new Date('2025-01-01'), 0, 200);
    expect(withExtra.monthsToPayoff).toBeLessThan(without.monthsToPayoff);
  });

  it('handles 0% interest', () => {
    const summary = buildAmortization(12000, 0, 1000, new Date('2025-01-01'));
    expect(summary.monthsToPayoff).toBe(12);
    expect(summary.totalInterest).toBe(0);
  });

  it('respects maxMonths', () => {
    const summary = buildAmortization(400000, 6, 599.55, new Date('2025-01-01'), 0, 0, 12);
    expect(summary.rows.length).toBeLessThanOrEqual(12);
  });
});

describe('loanPaidDownPercent', () => {
  it('calculates correct percentage', () => {
    expect(loanPaidDownPercent(400000, 300000)).toBeCloseTo(25, 2);
  });

  it('returns 100% when fully paid', () => {
    expect(loanPaidDownPercent(400000, 0)).toBe(100);
  });

  it('returns 0% when no payments made', () => {
    expect(loanPaidDownPercent(400000, 400000)).toBe(0);
  });

  it('returns 0 for zero original amount', () => {
    expect(loanPaidDownPercent(0, 0)).toBe(0);
  });
});

describe('computeRefinanceNpv', () => {
  it('returns positive NPV when refinancing saves money', () => {
    // Current: $2000/mo, 360 months remaining
    // New: $1800/mo, 360 months, $5000 closing costs
    const npv = computeRefinanceNpv(2000, 360, 6, 1800, 360, 5000, 5);
    expect(npv).toBeGreaterThan(0);
  });

  it('returns negative NPV when refinancing costs more', () => {
    // Current: $1800/mo, 360 months
    // New: $2000/mo, 360 months, $5000 closing costs
    const npv = computeRefinanceNpv(1800, 360, 6, 2000, 360, 5000, 5);
    expect(npv).toBeLessThan(0);
  });

  it('accounts for closing costs', () => {
    const noClosing = computeRefinanceNpv(2000, 360, 6, 1800, 360, 0, 5);
    const withClosing = computeRefinanceNpv(2000, 360, 6, 1800, 360, 10000, 5);
    expect(noClosing).toBeGreaterThan(withClosing);
    expect(noClosing - withClosing).toBeCloseTo(10000, 0);
  });
});

describe('computeBreakEvenMonths', () => {
  it('calculates break-even correctly', () => {
    expect(computeBreakEvenMonths(5000, 200)).toBe(25);
  });

  it('returns Infinity when no savings', () => {
    expect(computeBreakEvenMonths(5000, 0)).toBe(Infinity);
  });

  it('returns Infinity for negative savings', () => {
    expect(computeBreakEvenMonths(5000, -100)).toBe(Infinity);
  });

  it('rounds up partial months', () => {
    expect(computeBreakEvenMonths(5000, 300)).toBe(17); // 16.67 -> 17
  });
});
