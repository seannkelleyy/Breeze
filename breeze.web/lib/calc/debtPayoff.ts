/**
 * Debt payoff waterfall: avalanche (highest rate first) or snowball
 * (smallest balance first). Pure math — no React, no I/O.
 *
 * Each month every open debt accrues interest, then the monthly budget
 * (sum of active minimums + extra) pays minimums first and rolls everything
 * left onto the target debt in payoff order. When a debt closes, its minimum
 * rolls into the extra — the snowball effect. The baseline simulation pays
 * minimums only, with no rolling, which is what "just paying the minimums"
 * actually looks like.
 */

export type PayoffStrategy = 'AVALANCHE' | 'SNOWBALL';

export interface DebtPayoffDebt {
  id: string;
  name: string;
  balance: number;
  /** Annual interest rate, percent (6.5 = 6.5%/yr). */
  annualRatePercent: number;
  /** Monthly minimum payment. */
  minimumPayment: number;
}

export interface DebtPayoffInput {
  debts: DebtPayoffDebt[];
  /** Extra money per month beyond the minimums (rolled onto the target debt). */
  extraMonthlyPayment: number;
  strategy: PayoffStrategy;
  /** Simulation guard; default 600 months (50 years). */
  maxMonths?: number;
}

export interface DebtPayoffDebtResult {
  id: string;
  name: string;
  /** 1-based month the debt hits zero; null if it never does. */
  payoffMonth: number | null;
  totalInterest: number;
}

export interface DebtPayoffPlan {
  strategy: PayoffStrategy;
  /** Payoff order (by id), target debt first. */
  order: string[];
  /** Month the last debt closes; null when some debt is unpayable. */
  debtFreeMonth: number | null;
  totalInterest: number;
  perDebt: DebtPayoffDebtResult[];
  /** Month-end balances per debt, keyed by id, until debt-free (capped). */
  timeline: Array<{ month: number } & Record<string, number>>;
  /** Minimums-only world: no extra, no rolling. */
  baseline: { debtFreeMonth: number | null; totalInterest: number };
  interestSaved: number;
  monthsSaved: number | null;
  /** Debts whose minimum can't cover their monthly interest — they grow forever. */
  unpayable: string[];
}

interface SimulationResult {
  debtFreeMonth: number | null;
  totalInterest: number;
  perDebt: DebtPayoffDebtResult[];
  timeline: Array<{ month: number } & Record<string, number>>;
  unpayable: string[];
  order: string[];
}

const simulate = (
  debts: DebtPayoffDebt[],
  extraMonthlyPayment: number,
  order: string[],
  maxMonths: number,
  withRolling: boolean,
): SimulationResult => {
  const balances = new Map(debts.map((d) => [d.id, Math.max(0, d.balance)]));
  const interestPaid = new Map(debts.map((d) => [d.id, 0]));
  const payoffMonth = new Map<string, number>();
  const timeline: SimulationResult['timeline'] = [];
  const minimumOf = new Map(debts.map((d) => [d.id, Math.max(0, d.minimumPayment)]));
  const minimumSum = debts.reduce((sum, d) => sum + Math.max(0, d.minimumPayment), 0);
  let unpayable: string[] = [];

  let month = 0;
  for (; month < maxMonths; month++) {
    const open = order.filter((id) => (balances.get(id) ?? 0) > 0.005);
    if (open.length === 0) break;

    // 1. Interest accrues on every open debt.
    for (const id of open) {
      const debt = debts.find((d) => d.id === id)!;
      const interest = (balances.get(id) ?? 0) * (debt.annualRatePercent / 100 / 12);
      balances.set(id, (balances.get(id) ?? 0) + interest);
      interestPaid.set(id, (interestPaid.get(id) ?? 0) + interest);
    }

    // 2. Pay minimums (capped at each balance), then roll what's left onto
    // the target debt when rolling is on.
    let budget = minimumSum + (withRolling ? extraMonthlyPayment : 0);
    for (const id of open) {
      if (budget <= 0) break;
      const payment = Math.min(minimumOf.get(id) ?? 0, balances.get(id) ?? 0, budget);
      balances.set(id, (balances.get(id) ?? 0) - payment);
      budget -= payment;
    }
    if (withRolling) {
      for (const id of open) {
        if (budget <= 0) break;
        const payment = Math.min(budget, balances.get(id) ?? 0);
        balances.set(id, (balances.get(id) ?? 0) - payment);
        budget -= payment;
      }
    }

    // 3. Close paid-off debts.
    for (const id of open) {
      if ((balances.get(id) ?? 0) <= 0.005) {
        balances.set(id, 0);
        if (!payoffMonth.has(id)) payoffMonth.set(id, month + 1);
      }
    }

    timeline.push({
      month: month + 1,
      ...Object.fromEntries(debts.map((d) => [d.id, Math.max(0, balances.get(d.id) ?? 0)])),
    });
  }

  unpayable = debts
    .filter((d) => (balances.get(d.id) ?? 0) > 0.005)
    .map((d) => {
      const monthlyInterest = (balances.get(d.id) ?? 0) * (d.annualRatePercent / 100 / 12);
      return (minimumOf.get(d.id) ?? 0) <= monthlyInterest ? d.id : '';
    })
    .filter(Boolean);

  const debtFreeMonth =
    unpayable.length > 0 || debts.length === 0 ? null : Math.min(month, maxMonths);
  return {
    debtFreeMonth,
    totalInterest: [...interestPaid.values()].reduce((sum, v) => sum + v, 0),
    perDebt: debts.map((d) => ({
      id: d.id,
      name: d.name,
      payoffMonth: payoffMonth.get(d.id) ?? null,
      totalInterest: interestPaid.get(d.id) ?? 0,
    })),
    timeline,
    unpayable,
    order,
  };
};

const payoffOrder = (debts: DebtPayoffDebt[], strategy: PayoffStrategy): string[] =>
  [...debts]
    .sort((a, b) => {
      if (strategy === 'SNOWBALL') {
        if (a.balance !== b.balance) return a.balance - b.balance;
      } else if (b.annualRatePercent !== a.annualRatePercent) {
        return b.annualRatePercent - a.annualRatePercent;
      }
      if (a.balance !== b.balance) return a.balance - b.balance;
      return a.id.localeCompare(b.id);
    })
    .map((d) => d.id);

export const buildDebtPayoffPlan = (input: DebtPayoffInput): DebtPayoffPlan => {
  const { debts, extraMonthlyPayment, strategy, maxMonths = 600 } = input;
  const order = payoffOrder(debts, strategy);

  const plan = simulate(debts, extraMonthlyPayment, order, maxMonths, true);
  // The baseline rolls freed minimums too, so the comparison isolates exactly
  // what the extra payment buys rather than crediting the roll itself.
  const baseline = simulate(debts, 0, order, maxMonths, true);

  const monthsSaved =
    plan.debtFreeMonth !== null && baseline.debtFreeMonth !== null
      ? baseline.debtFreeMonth - plan.debtFreeMonth
      : null;

  return {
    strategy,
    order,
    debtFreeMonth: plan.debtFreeMonth,
    totalInterest: plan.totalInterest,
    perDebt: plan.perDebt,
    timeline: plan.timeline,
    baseline: { debtFreeMonth: baseline.debtFreeMonth, totalInterest: baseline.totalInterest },
    interestSaved: Math.max(0, baseline.totalInterest - plan.totalInterest),
    monthsSaved,
    unpayable: plan.unpayable,
  };
};
