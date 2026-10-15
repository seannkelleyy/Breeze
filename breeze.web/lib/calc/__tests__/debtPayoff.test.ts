import { describe, it, expect } from 'vitest';
import { buildDebtPayoffPlan, type DebtPayoffDebt } from '../debtPayoff';

const debt = (
  id: string,
  balance: number,
  annualRatePercent: number,
  minimumPayment: number,
  name = id,
): DebtPayoffDebt => ({ id, name, balance, annualRatePercent, minimumPayment });

describe('buildDebtPayoffPlan', () => {
  it('pays the highest-rate debt first under avalanche', () => {
    const plan = buildDebtPayoffPlan({
      debts: [
        debt('car', 10000, 6, 300),
        debt('card', 5000, 22, 150),
      ],
      extraMonthlyPayment: 0,
      strategy: 'AVALANCHE',
    });

    expect(plan.order).toEqual(['card', 'car']);
  });

  it('pays the smallest balance first under snowball', () => {
    const plan = buildDebtPayoffPlan({
      debts: [
        debt('car', 10000, 6, 300),
        debt('card', 5000, 22, 150),
      ],
      extraMonthlyPayment: 0,
      strategy: 'SNOWBALL',
    });

    expect(plan.order).toEqual(['card', 'car']);
  });

  it('avalanche and snowball differ when the smaller debt has the lower rate', () => {
    const debts = [
      debt('big-high-rate', 10000, 20, 250),
      debt('small-low-rate', 1000, 5, 50),
    ];
    const avalanche = buildDebtPayoffPlan({ debts, extraMonthlyPayment: 500, strategy: 'AVALANCHE' });
    const snowball = buildDebtPayoffPlan({ debts, extraMonthlyPayment: 500, strategy: 'SNOWBALL' });

    expect(avalanche.order[0]).toBe('big-high-rate');
    expect(snowball.order[0]).toBe('small-low-rate');
    // Avalanche is the cheaper strategy on paper: less interest paid overall.
    expect(avalanche.totalInterest).toBeLessThan(snowball.totalInterest);
  });

  it('rolls closed-debt minimums into the extra (the snowball effect)', () => {
    // Card A: 1000 at 0%, min 100 → paid off in 10 months. Card B: 1200 at 0%,
    // min 100. With 100 extra and rolling, B clears 10 months after A.
    const plan = buildDebtPayoffPlan({
      debts: [debt('a', 1000, 0, 100), debt('b', 1200, 0, 100)],
      extraMonthlyPayment: 100,
      strategy: 'SNOWBALL',
    });

    // The extra rolls onto a immediately (200/mo → closed in 5 months), then
    // all 300/month lands on b: 1200 − 500 = 700 clears in three more months.
    expect(plan.perDebt[0].payoffMonth).toBe(5);
    expect(plan.perDebt[1].payoffMonth).toBe(8);
    expect(plan.debtFreeMonth).toBe(8);
  });

  it('charges interest at rate/12 monthly and tracks it per debt', () => {
    const plan = buildDebtPayoffPlan({
      debts: [debt('loan', 1200, 12, 100)],
      extraMonthlyPayment: 100,
      strategy: 'AVALANCHE',
    });

    // 100/mo against 1200 at 1%/mo: balances 1112, 1022.12, ... standard
    // amortization. Total interest must be positive but small.
    expect(plan.totalInterest).toBeGreaterThan(0);
    expect(plan.totalInterest).toBeLessThan(200);
    expect(plan.debtFreeMonth).toBeGreaterThan(6);
    expect(plan.debtFreeMonth).toBeLessThan(15);
  });

  it('extra payments save interest and months versus minimums-only', () => {
    const plan = buildDebtPayoffPlan({
      debts: [
        debt('card', 5000, 22, 150),
        debt('car', 10000, 6, 300),
      ],
      extraMonthlyPayment: 400,
      strategy: 'AVALANCHE',
    });

    expect(plan.baseline.totalInterest).toBeGreaterThan(plan.totalInterest);
    expect(plan.interestSaved).toBeCloseTo(plan.baseline.totalInterest - plan.totalInterest, 6);
    expect(plan.monthsSaved).not.toBeNull();
    expect(plan.monthsSaved!).toBeGreaterThan(0);
  });

  it('flags debts whose minimum cannot cover the monthly interest', () => {
    const plan = buildDebtPayoffPlan({
      debts: [
        debt('spiral', 20000, 30, 100), // interest ≈ 500/mo vs 100 minimum
        debt('ok', 1000, 0, 100),
      ],
      extraMonthlyPayment: 0,
      strategy: 'AVALANCHE',
    });

    expect(plan.unpayable).toContain('spiral');
    expect(plan.debtFreeMonth).toBeNull();
  });

  it('produces a month-end timeline with every debt balance', () => {
    const plan = buildDebtPayoffPlan({
      debts: [debt('a', 300, 0, 100), debt('b', 600, 0, 100)],
      extraMonthlyPayment: 0,
      strategy: 'AVALANCHE',
    });

    // a closes at month 3; its minimum rolls into b from month 4 (200/mo).
    expect(plan.timeline).toHaveLength(5);
    expect(plan.timeline[0]).toMatchObject({ month: 1, a: 200, b: 500 });
    expect(plan.timeline[2]).toMatchObject({ month: 3, a: 0, b: 300 });
    expect(plan.timeline[4]).toMatchObject({ month: 5, a: 0, b: 0 });
  });

  it('handles an empty debt list', () => {
    const plan = buildDebtPayoffPlan({
      debts: [],
      extraMonthlyPayment: 0,
      strategy: 'AVALANCHE',
    });

    expect(plan.debtFreeMonth).toBeNull();
    expect(plan.totalInterest).toBe(0);
    expect(plan.timeline).toHaveLength(0);
  });
});
