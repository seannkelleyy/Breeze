import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';

const {
  userState,
  plannerState,
  recurringState,
  retirementAccessState,
  householdState,
  portfolioState,
  targetsState,
  projectionsState,
  summaryMock,
  portfolioMock,
  targetsMock,
  projectionsMock,
  fireAgesMock,
  setPlannerSummary,
} = vi.hoisted(() => ({
  userState: {
    returnDisplayMode: 'nominal' as 'nominal' | 'real',
    inflationRate: 3,
    safeWithdrawalRate: 4,
    filingStatus: 'single',
    deductionType: 'standard',
    userId: 'u1',
  },
  plannerState: {
    plannerDesiredInvestmentAmount: 2000000,
    plannerRetirementMethod: 'standard',
    plannerPeople: [] as Array<Record<string, unknown>>,
    plannerAccounts: [] as Array<Record<string, unknown>>,
    plannerAssetFinanceDetailsByAccountId: {},
  },
  recurringState: { monthlyTotal: 2500 },
  retirementAccessState: {
    data: {
      hsaSummary: { availableToReimburse: '1500.00' },
      rothBuckets: [{ availableOn: '2027-01-01', amount: '5000.00' }],
    },
  },
  householdState: {
    currentAge: 40,
    targetAge: 65,
    annualHouseholdIncome: 150000,
    yearsToGoal: 25,
    people: [{ id: 'p1' }],
  },
  portfolioState: {
    currentSavingsRateEmployee: 10,
    currentSavingsRateTotal: 15,
    effectiveWeightedAnnualRate: 6,
    totalStartingBalance: 100000,
    totalAssets: 150000,
    totalLiabilities: 50000,
    totalPlannedMonthlyInvestment: 2000,
    investmentStartingBalance: 90000,
    realWeightedAnnualRate: 3,
    emergencyFundBalance: 20000,
  },
  targetsState: {
    monthlyNeededForDesiredTarget: 1000,
    selectedRetirementMethodLabel: 'Standard',
    requiredSavingsRate: 20,
    savingsRateGap: 5,
    monthlyGap: 100,
    isMonthlyGapPositive: true,
    annualNeedAtRetirement: 60000,
    financialFreedomTarget: 1500000,
    monthlyNeededForFreedomTarget: 1200,
    fireTargets: [
      { label: 'Lean FIRE', target: 1000000 },
      { label: 'Fat FIRE', target: 3000000 },
    ],
    incomeReplacementTarget: 1200000,
    incomeReplacementAnnualNeed: 80000,
    baseFinancialFreedomTarget: 1400000,
    retirementHorizonYears: 25,
    suggestedSafeWithdrawalRate: 4.2,
    coastFireTargetToday: 500000,
    coastFireGap: 250000,
    hasReachedCoastFire: false,
    projectedHouseholdIncomeAtRetirement: 180000,
  },
  projectionsState: {
    projectionRows: [{ age: 40 }],
    withdrawalRows: [{ age: 66 }],
    finalBalances: { a1: 100 },
    projectedNetWorthAtTargetAge: 2000000,
    portfolioAverageRates: [{ id: 'a1', rate: 6 }],
  },
  summaryMock: { monthlyExpenses: 2500 },
  portfolioMock: vi.fn(),
  targetsMock: vi.fn(),
  projectionsMock: vi.fn(),
  fireAgesMock: vi.fn(),
  setPlannerSummary: vi.fn(),
}));

vi.mock('@/lib/providers/CurrentUserProvider', () => ({
  useCurrentUser: () => userState,
}));

vi.mock('@/features/planning/providers/PlannerStateProvider', () => ({
  usePlannerState: () => ({ ...plannerState, setPlannerSummary }),
}));

vi.mock('@/features/recurring/hooks/recurringTemplateServices', () => ({
  useRecurringExpenseTemplates: () => ({ data: [] }),
  getRecurringExpensesMonthlyTotal: () => recurringState.monthlyTotal,
}));

vi.mock('@/features/retirement-access/hooks/useRetirementAccess', () => ({
  useRetirementAccess: () => retirementAccessState,
}));

vi.mock('../useIrsLimits', () => ({
  default: () => ({ irsLimits: {} }),
}));

vi.mock('../useTaxYear', () => ({
  default: () => ({ brackets: [] }),
}));

vi.mock('../usePaycheckDeductions', () => ({
  usePaycheckDeductions: () => ({ deductions: [] }),
}));

vi.mock('../model/useHouseholdCalculation', () => ({
  useHouseholdCalculation: () => householdState,
}));

vi.mock('../model/usePortfolioCalculation', () => ({
  usePortfolioCalculation: portfolioMock,
}));

vi.mock('../model/useRetirementTargets', () => ({
  useRetirementTargets: targetsMock,
}));

vi.mock('../model/useFinancialMathSnapshot', () => ({
  useFinancialMathSnapshot: () => summaryMock,
}));

vi.mock('../model/useProjections', () => ({
  useProjections: projectionsMock,
}));

vi.mock('../model/useFinancialFreedomAges', () => ({
  useFinancialFreedomAge: () => 55,
  useFireAchievementAges: fireAgesMock,
}));

vi.mock('../model/useAccountBreakdown', () => ({
  useAccountBreakdown: () => [{ id: 'a1' }],
}));

vi.mock('../model/useChartConfig', () => ({
  useChartConfig: () => ({ series: ['a1'] }),
}));

import usePlannerModel from '../usePlannerModel';

const account = (overrides: Record<string, unknown> = {}) => ({
  id: 'a1',
  name: 'Account',
  personIds: ['p1'],
  accountType: 'checking',
  contributionMode: 'monthly',
  linkedLiabilityId: null,
  contributionValue: 0,
  employerMatchRate: 0,
  employerMatchMaxPercentOfSalary: 0,
  startingBalance: 10000,
  annualRate: 4,
  ...overrides,
});

const person = {
  id: 'p1',
  name: 'Alex',
  birthday: '1986-01-01',
  retirementAge: 65,
  annualSalary: 100000,
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
};

describe('usePlannerModel', () => {
  beforeEach(() => {
    userState.returnDisplayMode = 'nominal';
    plannerState.plannerDesiredInvestmentAmount = 2000000;
    plannerState.plannerPeople = [person];
    plannerState.plannerAccounts = [account()];
    portfolioMock.mockReset().mockReturnValue(portfolioState);
    targetsMock.mockReset().mockReturnValue(targetsState);
    projectionsMock.mockReset().mockReturnValue(projectionsState);
    fireAgesMock.mockReset().mockReturnValue([{ label: 'Lean FIRE', age: 50 }]);
    setPlannerSummary.mockReset();
  });

  it('exposes the model outputs and defaults to the household target age', () => {
    const { result } = renderHook(() => usePlannerModel());

    expect(result.current.targetAge).toBe(65);
    expect(result.current.currentAge).toBe(40);
    expect(result.current.monthlyExpenses).toBe(2500);
    expect(result.current.projectionRows).toEqual(projectionsState.projectionRows);
    expect(result.current.withdrawalRows).toEqual(projectionsState.withdrawalRows);
    expect(result.current.accountBreakdownRows).toEqual([{ id: 'a1' }]);
    expect(result.current.projectedNetWorthAtTargetAge).toBe(2000000);
    expect(result.current.financialFreedomAge).toBe(55);
    expect(result.current.totalAssets).toBe(150000);
    expect(result.current.totalLiabilities).toBe(50000);
    expect(result.current.currentSavingsRate).toBe(15);
    expect(result.current.projectionEndAge).toBe(95);
  });

  it('applies a retirement-age override to the model and targets', () => {
    const { result } = renderHook(() => usePlannerModel());

    act(() => {
      result.current.setRetirementAgeOverride(60);
    });

    expect(result.current.targetAge).toBe(60);
    const effectiveHousehold = targetsMock.mock.calls.at(-1)?.[0] as { targetAge: number };
    expect(effectiveHousehold.targetAge).toBe(60);
    // Milestone ages stay anchored to the real current age, not the what-if.
    const milestoneArgs = fireAgesMock.mock.calls.at(-1);
    expect(milestoneArgs?.[2]).toBe(40);
  });

  it('pushes a coherent summary into planner context', () => {
    renderHook(() => usePlannerModel());

    expect(setPlannerSummary).toHaveBeenCalledTimes(1);
    expect(setPlannerSummary).toHaveBeenCalledWith(
      expect.objectContaining({
        monthlyNeededForDesiredTarget: 1000,
        annualHouseholdIncome: 150000,
        weightedAnnualRate: 6,
        totalStartingBalance: 100000,
        totalAssets: 150000,
        totalLiabilities: 50000,
        targetAge: 65,
        projectedNetWorthAtTargetAge: 2000000,
        financialFreedomTarget: 1500000,
      }),
    );
  });

  it('sorts milestone targets and pins a custom goal last', () => {
    const { result } = renderHook(() => usePlannerModel());

    expect(result.current.milestones).toEqual([{ label: 'Lean FIRE', age: 50 }]);
    const milestoneTargets = fireAgesMock.mock.calls[0][1] as Array<{
      label: string;
      target: number;
    }>;
    expect(milestoneTargets.map((m) => m.label)).toEqual([
      'Lean FIRE',
      'Income replacement',
      'Fat FIRE',
      'Custom',
    ]);
  });

  it('omits the custom milestone when no desired amount is set', () => {
    plannerState.plannerDesiredInvestmentAmount = 0;
    renderHook(() => usePlannerModel());

    const milestoneTargets = fireAgesMock.mock.calls[0][1] as Array<{ label: string }>;
    expect(milestoneTargets.map((m) => m.label)).not.toContain('Custom');
  });

  it('excludes linked liabilities from the working set but counts their principal', () => {
    plannerState.plannerAccounts = [
      account({ id: 'home1', accountType: 'home', linkedLiabilityId: 'l1' }),
      account({
        id: 'l1',
        accountType: 'mortgage',
        startingBalance: 300000,
        annualRate: 6,
        contributionValue: 5000,
      }),
      account({ id: 'checking1' }),
    ];
    renderHook(() => usePlannerModel());

    const filtered = portfolioMock.mock.calls[0][0] as Array<{ id: string }>;
    expect(filtered.map((a) => a.id)).toEqual(['home1', 'checking1']);
    expect(portfolioMock.mock.calls[0][5]).toBeGreaterThan(0);
  });

  it('passes HSA receipts and Roth conversion clocks into projections', () => {
    renderHook(() => usePlannerModel());

    const withdrawalPlan = projectionsMock.mock.calls[0][9] as {
      hsaReceiptBalance: number;
      conversionBuckets: Array<{ availableOn: string; amount: number }>;
    };
    expect(withdrawalPlan).toEqual({
      hsaReceiptBalance: 1500,
      conversionBuckets: [{ availableOn: '2027-01-01', amount: 5000 }],
    });
  });

  it('updates projection end age and market adjustment', () => {
    const { result } = renderHook(() => usePlannerModel());

    act(() => {
      result.current.setProjectionEndAge(90);
      result.current.setMarketAdjustment(-10);
    });

    expect(result.current.projectionEndAge).toBe(90);
    expect(result.current.marketAdjustment).toBe(-10);
  });
});
