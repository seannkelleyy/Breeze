import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';

import type { PlannerPerson } from '@/features/planning/types/person';
import {
  PLANNER_DEFAULT_FIRE_LIFESTYLE_INDEX,
  PLANNER_DEFAULT_LONGEVITY_AGE,
} from '@/features/planning/lib/constants';
import { useRetirementTargets } from '../useRetirementTargets';
import type { Household, Portfolio } from '../types';

const person = (overrides: Partial<PlannerPerson> = {}): PlannerPerson => ({
  id: 'p1',
  name: 'Alex',
  birthday: '1986-01-01',
  retirementAge: 65,
  annualSalary: 100_000,
  bonusMode: 'dollars',
  bonusFrequency: 'annual',
  annualBonus: 0,
  incomeGrowthRate: 3,
  isPrimary: true,
  payType: 'salary',
  payDay: 1,
  payCadence: 'biweekly',
  hourlyRate: 0,
  expectedHoursPerWeek: 0,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

const household = (overrides: Partial<Household> = {}): Household => ({
  people: [person()],
  currentAge: 40,
  targetAge: 65,
  yearsToGoal: 25,
  annualHouseholdIncome: 100_000,
  ...overrides,
});

const portfolio = (overrides: Partial<Portfolio> = {}): Portfolio => ({
  totalStartingBalance: 500_000,
  investmentStartingBalance: 400_000,
  totalAssets: 500_000,
  totalLiabilities: 0,
  totalPlannedMonthlyEmployee: 1_000,
  totalPlannedMonthlyInvestment: 2_000,
  weightedAnnualRate: 7,
  effectiveWeightedAnnualRate: 7,
  realWeightedAnnualRate: 5,
  currentSavingsRateEmployee: 12,
  currentSavingsRateTotal: 20,
  emergencyFundBalance: 20_000,
  ...overrides,
});

const renderTargets = (
  options: {
    household?: Household;
    portfolio?: Portfolio;
    inflationRate?: number;
    safeWithdrawalRate?: number;
    monthlyExpenses?: number;
    desiredInvestmentAmount?: number;
    retirementMethod?: string;
    useInflationAdjustedValues?: boolean;
  } = {},
) => {
  const {
    household: h = household(),
    portfolio: p = portfolio(),
    inflationRate = 3,
    safeWithdrawalRate = 4,
    monthlyExpenses = 5_000,
    desiredInvestmentAmount = 1_500_000,
    retirementMethod = 'target-amount',
    useInflationAdjustedValues = false,
  } = options;

  return renderHook(() =>
    useRetirementTargets(
      h,
      p,
      inflationRate,
      safeWithdrawalRate,
      monthlyExpenses,
      desiredInvestmentAmount,
      retirementMethod,
      useInflationAdjustedValues,
    ),
  );
};

describe('useRetirementTargets', () => {
  it('inflates the annual need and derives the FIRE targets from it', () => {
    const { result } = renderTargets();

    const inflationFactor = 1.03 ** 25;
    const annualNeedAtRetirement = 60_000 * inflationFactor;

    expect(result.current.annualNeedAtRetirement).toBeCloseTo(annualNeedAtRetirement, 6);
    expect(result.current.baseFinancialFreedomTarget).toBeCloseTo(annualNeedAtRetirement / 0.04, 6);
    expect(result.current.retirementHorizonYears).toBe(PLANNER_DEFAULT_LONGEVITY_AGE - 65);
    // 30-year horizon suggests a 4% withdrawal rate.
    expect(result.current.suggestedSafeWithdrawalRate).toBe(4);

    expect(result.current.fireTargets).toHaveLength(5);
    expect(result.current.fireTargets[0].label).toBe('Bare Minimum');
    expect(result.current.fireTargets[0].target).toBeCloseTo(
      result.current.baseFinancialFreedomTarget * 0.8,
      6,
    );
    // Standard FIRE is the default lifestyle: multiplier 1.0.
    expect(result.current.financialFreedomTarget).toBeCloseTo(
      result.current.baseFinancialFreedomTarget,
      6,
    );
    const standardFire = result.current.fireTargets[PLANNER_DEFAULT_FIRE_LIFESTYLE_INDEX];
    expect(standardFire.monthlySpendSupported).toBeCloseTo(annualNeedAtRetirement / 12, 6);
  });

  it('uses the real growth rate for projected income when showing real values', () => {
    const { result } = renderTargets({ useInflationAdjustedValues: true });

    // Nominal growth of 3% deflated by 3% inflation is 0% real growth.
    expect(result.current.projectedHouseholdIncomeAtRetirement).toBeCloseTo(100_000, 6);
    // Today's dollars: the annual need is not inflated.
    expect(result.current.annualNeedAtRetirement).toBe(60_000);
    expect(result.current.financialFreedomTarget).toBeCloseTo(1_500_000, 6);
  });

  it('projects nominal income when showing future dollars', () => {
    const { result } = renderTargets({ useInflationAdjustedValues: false });

    expect(result.current.projectedHouseholdIncomeAtRetirement).toBeCloseTo(
      100_000 * 1.03 ** 25,
      6,
    );
  });

  it('selects the custom target amount for the target-amount method', () => {
    const { result } = renderTargets({ retirementMethod: 'target-amount' });

    expect(result.current.selectedRetirementTarget).toBe(1_500_000);
    expect(result.current.selectedRetirementMethodLabel).toBe('Custom Target');
  });

  it('selects the financial freedom target for the fire method', () => {
    const { result } = renderTargets({ retirementMethod: 'fire' });

    expect(result.current.selectedRetirementTarget).toBe(result.current.financialFreedomTarget);
    expect(result.current.selectedRetirementMethodLabel).toBe('FIRE Method');
  });

  it('selects the income replacement target for the income-replacement method', () => {
    const { result } = renderTargets({ retirementMethod: 'income-replacement' });

    // 80% of $100k household income, inflated over 25 years, capitalized at 4%.
    const expected = (100_000 * 0.8 * 1.03 ** 25) / 0.04;
    expect(result.current.incomeReplacementAnnualNeedToday).toBe(80_000);
    expect(result.current.incomeReplacementTarget).toBeCloseTo(expected, 6);
    expect(result.current.selectedRetirementTarget).toBeCloseTo(expected, 6);
    expect(result.current.selectedRetirementMethodLabel).toBe('Income Replacement');
  });

  it('falls back to a generic label for unknown methods', () => {
    const { result } = renderTargets({ retirementMethod: 'unknown-method' });

    expect(result.current.selectedRetirementMethodLabel).toBe('Selected Method');
    expect(result.current.selectedRetirementTarget).toBe(result.current.financialFreedomTarget);
  });

  it('computes savings-rate and monthly gaps against the plan', () => {
    const { result } = renderTargets();

    const monthlyNeeded = result.current.monthlyNeededForDesiredTarget;
    expect(monthlyNeeded).toBeGreaterThan(0);
    expect(result.current.requiredSavingsRate).toBeCloseTo((monthlyNeeded * 12 * 100) / 100_000, 6);
    expect(result.current.savingsRateGap).toBeCloseTo(20 - result.current.requiredSavingsRate, 6);
    expect(result.current.monthlyGap).toBeCloseTo(2_000 - monthlyNeeded, 6);
    expect(result.current.isMonthlyGapPositive).toBe(result.current.monthlyGap >= -1);
  });

  it('reports coast FIRE progress from the real target and real return', () => {
    const { result } = renderTargets();

    const expectedCoastTarget = result.current.fireTargets[2].target / 1.05 ** 25;
    // fireTargets[2].target is the nominal value; the real target is today's dollars.
    const realCoastTarget = 1_500_000 / 1.05 ** 25;
    expect(result.current.coastFireTargetToday).toBeCloseTo(realCoastTarget, 6);
    expect(expectedCoastTarget).toBeGreaterThan(0);
    expect(result.current.coastFireGap).toBeCloseTo(400_000 - realCoastTarget, 6);
    expect(result.current.hasReachedCoastFire).toBe(false);
  });

  it('marks coast FIRE reached when the portfolio covers the discounted target', () => {
    const { result } = renderTargets({
      portfolio: portfolio({ investmentStartingBalance: 500_000 }),
    });

    expect(result.current.coastFireGap).toBeGreaterThan(0);
    expect(result.current.hasReachedCoastFire).toBe(true);
  });

  it('zeroes withdrawal-dependent targets when the safe withdrawal rate is zero', () => {
    const { result } = renderTargets({ safeWithdrawalRate: 0 });

    expect(result.current.baseFinancialFreedomTarget).toBe(0);
    for (const target of result.current.fireTargets) {
      expect(target.target).toBe(0);
      expect(target.monthlySpendSupported).toBe(0);
    }
    expect(result.current.incomeReplacementTarget).toBe(0);
    expect(result.current.financialFreedomTarget).toBe(0);
  });

  it('floors the retirement horizon at one year', () => {
    const { result } = renderTargets({
      household: household({ targetAge: PLANNER_DEFAULT_LONGEVITY_AGE }),
    });

    expect(result.current.retirementHorizonYears).toBe(1);
    expect(result.current.suggestedSafeWithdrawalRate).toBe(4.5);
  });

  it('guards against a negative real growth denominator', () => {
    const { result } = renderTargets({
      inflationRate: -100,
      useInflationAdjustedValues: true,
    });

    // getRealGrowthRate returns the nominal rate when inflation <= -100%.
    expect(result.current.projectedHouseholdIncomeAtRetirement).toBeCloseTo(
      100_000 * 1.03 ** 25,
      6,
    );
  });
});
