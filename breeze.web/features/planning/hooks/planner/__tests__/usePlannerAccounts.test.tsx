import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import type { PlannerAccount } from '@/features/planning/types/account';
import type { PlannerPerson } from '@/features/planning/types/person';
import type { AssetFinanceDetails } from '@/features/planning/types/finance';

const { userState, plannerState, irsState } = vi.hoisted(() => ({
  userState: { returnDisplayMode: 'nominal' as 'nominal' | 'real', inflationRate: 3 },
  plannerState: {
    plannerSummary: null as {
      totalPlannedMonthlyInvestment?: number;
      weightedAnnualRate?: number;
    } | null,
    plannerAccounts: [] as PlannerAccount[],
    plannerPeople: [] as PlannerPerson[],
    plannerAssetFinanceDetailsByAccountId: {} as Record<string, AssetFinanceDetails>,
    setPlannerAccounts: vi.fn(),
    setPlannerAssetFinanceDetailsByAccountId: vi.fn(),
  },
  irsState: {
    irsLimits: {
      '401k': { baseAnnualLimit: 24500, catchUpAmount: 8000, catchUpAge: 50 },
    },
    isIrsAccountsLoading: false,
    isIrsAccountsError: false,
  },
}));

vi.mock('@/lib/providers/CurrentUserProvider', () => ({
  useCurrentUser: () => userState,
}));

vi.mock('@/features/planning/providers/PlannerStateProvider', () => ({
  usePlannerState: () => plannerState,
}));

vi.mock('../useIrsLimits', () => ({
  default: () => irsState,
}));

import usePlannerAccounts from '../usePlannerAccounts';

const person = (): PlannerPerson => ({
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
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
});

const account = (overrides: Partial<PlannerAccount> = {}): PlannerAccount => ({
  id: 'a1',
  name: 'Checking',
  personIds: ['p1'],
  accountType: 'checking',
  contributionMode: 'monthly',
  contributionValue: 250,
  employerMatchRate: 0,
  employerMatchMaxPercentOfSalary: 0,
  startingBalance: 10000,
  annualRate: 4,
  returnProfile: null,
  pretaxSharePercent: null,
  purchaseDate: null,
  purchasePrice: null,
  homeGrowthProfile: null,
  vehicleDepreciationProfile: null,
  linkedLiabilityId: null,
  plaidAccountId: null,
  lastValueUpdatedAt: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

const renderAccounts = () => renderHook(() => usePlannerAccounts());

describe('usePlannerAccounts', () => {
  beforeEach(() => {
    userState.returnDisplayMode = 'nominal';
    userState.inflationRate = 3;
    plannerState.plannerSummary = null;
    plannerState.plannerAccounts = [account()];
    plannerState.plannerPeople = [person()];
    plannerState.plannerAssetFinanceDetailsByAccountId = {};
    plannerState.setPlannerAccounts.mockReset().mockImplementation((updater) => {
      plannerState.plannerAccounts =
        typeof updater === 'function' ? updater(plannerState.plannerAccounts) : updater;
    });
    plannerState.setPlannerAssetFinanceDetailsByAccountId
      .mockReset()
      .mockImplementation((updater) => {
        plannerState.plannerAssetFinanceDetailsByAccountId =
          typeof updater === 'function'
            ? updater(plannerState.plannerAssetFinanceDetailsByAccountId)
            : updater;
      });
  });

  it('labels rate profiles with nominal rates by default', () => {
    const { result } = renderAccounts();

    const stocks = result.current.options.accountRateProfileOptions.find(
      (option) => option.value === 'stocks',
    );
    expect(stocks?.label).toContain('10.0%');
  });

  it('deflates profile rates in real display mode', () => {
    userState.returnDisplayMode = 'real';
    const { result } = renderAccounts();

    const stocks = result.current.options.accountRateProfileOptions.find(
      (option) => option.value === 'stocks',
    );
    expect(stocks?.label).not.toContain('10.0%');
    expect(stocks?.label).toMatch(/%\)$/);
  });

  it('leaves custom and none profile labels alone', () => {
    const { result } = renderAccounts();

    const custom = result.current.options.accountRateProfileOptions.find(
      (option) => option.value === 'custom',
    );
    const none = result.current.options.accountRateProfileOptions.find(
      (option) => option.value === 'none',
    );
    expect(custom?.label).toBe('Custom %');
    expect(none?.label).toBe('None (0.0%)');
  });

  it('updates only the matching account', () => {
    plannerState.plannerAccounts = [account(), account({ id: 'a2', name: 'Brokerage' })];
    const { result } = renderAccounts();

    act(() => {
      result.current.actions.updateAccount('a1', (current) => ({ ...current, name: 'Main' }));
    });

    expect(plannerState.plannerAccounts.map((a) => a.name)).toEqual(['Main', 'Brokerage']);
  });

  it('refuses to remove the last account', () => {
    const { result } = renderAccounts();

    act(() => {
      result.current.actions.removeAccount('a1');
    });

    expect(plannerState.plannerAccounts).toHaveLength(1);
  });

  it('removes an account and its finance details', () => {
    plannerState.plannerAccounts = [account(), account({ id: 'a2' })];
    plannerState.plannerAssetFinanceDetailsByAccountId = {
      a1: { currentValue: 10000 } as AssetFinanceDetails,
      a2: { currentValue: 20000 } as AssetFinanceDetails,
    };
    const { result } = renderAccounts();

    act(() => {
      result.current.actions.removeAccount('a1');
    });

    expect(plannerState.plannerAccounts.map((a) => a.id)).toEqual(['a2']);
    expect(plannerState.plannerAssetFinanceDetailsByAccountId).not.toHaveProperty('a1');
    expect(plannerState.plannerAssetFinanceDetailsByAccountId).toHaveProperty('a2');
  });

  it('adds a new account using the summary weighted rate', () => {
    plannerState.plannerSummary = { weightedAnnualRate: 6.5 };
    const { result } = renderAccounts();

    act(() => {
      result.current.actions.addAccount();
    });

    expect(plannerState.plannerAccounts).toHaveLength(2);
    expect(plannerState.plannerAccounts[1]).toMatchObject({
      name: 'Account 2',
      annualRate: 6.5,
    });
    expect(plannerState.plannerAccounts[1].id).toMatch(/^local-/);
  });

  it('adds a new liability with loan defaults', () => {
    const { result } = renderAccounts();

    act(() => {
      result.current.actions.addLiability();
    });

    expect(plannerState.plannerAccounts).toHaveLength(2);
    expect(plannerState.plannerAccounts[1]).toMatchObject({
      name: 'Liability 2',
      accountType: 'student-loan',
      startingBalance: 25000,
      annualRate: 6,
      contributionValue: 500,
    });
  });

  it('syncs asset finance details back onto the account', () => {
    const home = account({
      id: 'home1',
      name: 'Home',
      accountType: 'home',
      startingBalance: 500000,
      annualRate: 4,
      homeGrowthProfile: 'medium',
    });
    plannerState.plannerAccounts = [home];
    const { result } = renderAccounts();

    act(() => {
      result.current.actions.updateAssetFinanceDetails('home1', (details) => ({
        ...details,
        currentValue: 525000,
        annualChangeRate: 5,
      }));
    });

    expect(plannerState.plannerAccounts[0]).toMatchObject({
      startingBalance: 525000,
      annualRate: 5,
    });
    expect(plannerState.plannerAssetFinanceDetailsByAccountId.home1).toMatchObject({
      currentValue: 525000,
      annualChangeRate: 5,
    });
  });

  it('keeps a liability’s stated APR when displaying its rate', () => {
    const { result } = renderAccounts();
    const loan = account({ accountType: 'student-loan', annualRate: 5.5 });

    expect(result.current.helpers.getDisplayedRateForAccount(loan)).toBe(5.5);
  });

  it('exposes IRS limits and planner totals', () => {
    const { result } = renderAccounts();

    expect(result.current.data.isIrsAccountsLoading).toBe(false);
    expect(result.current.data.isIrsAccountsError).toBe(false);
    expect(result.current.helpers.getSuggestedAnnualLimitForAccount('401k', 30)).toBe(24500);
    expect(result.current.data.totalPlannedMonthlyEmployee).toBeGreaterThan(0);
  });
});
