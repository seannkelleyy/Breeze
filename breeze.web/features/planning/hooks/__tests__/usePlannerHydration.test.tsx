import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

import type { PlannerAccount } from '@/features/planning/types/account';
import type { PlannerPerson } from '@/features/planning/types/person';
import type { AssetFinanceDetails } from '@/features/planning/types/finance';

type PlannerLoadResult = {
  people: PlannerPerson[];
  accounts: PlannerAccount[];
  inflationRate: number;
  safeWithdrawalRate: number;
  currencyCode: string;
  returnDisplayMode: 'real' | 'nominal';
};

const { fetchState, setters, finance } = vi.hoisted(() => ({
  fetchState: { data: null as PlannerLoadResult | null },
  setters: {
    setPlannerAccounts: vi.fn(),
    setPlannerPeople: vi.fn(),
    setPlannerAssetFinanceDetailsByAccountId: vi.fn(),
    setInflationRate: vi.fn(),
    setSafeWithdrawalRate: vi.fn(),
    setCurrencyCode: vi.fn(),
  },
  finance: { assetDetails: {} as Record<string, AssetFinanceDetails> },
}));

vi.mock('@/features/planning/hooks/planner/index', () => ({
  useFetchPlanner: () => ({ data: fetchState.data }),
}));

vi.mock('@/features/planning/providers/PlannerStateProvider', () => ({
  usePlannerState: () => ({
    setPlannerAccounts: setters.setPlannerAccounts,
    setPlannerPeople: setters.setPlannerPeople,
    setPlannerAssetFinanceDetailsByAccountId: setters.setPlannerAssetFinanceDetailsByAccountId,
  }),
}));

vi.mock('@/lib/providers/CurrentUserProvider', () => ({
  useCurrentUser: () => ({
    setInflationRate: setters.setInflationRate,
    setSafeWithdrawalRate: setters.setSafeWithdrawalRate,
    setCurrencyCode: setters.setCurrencyCode,
  }),
}));

import { usePlannerHydration } from '../usePlannerHydration';

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

const account = (overrides: Partial<PlannerAccount> = {}): PlannerAccount => ({
  id: 'home1',
  name: 'Primary Home',
  personIds: ['p1'],
  accountType: 'home',
  contributionMode: 'monthly',
  contributionValue: 0,
  employerMatchRate: 0,
  employerMatchMaxPercentOfSalary: 0,
  startingBalance: 600_000,
  annualRate: 4,
  returnProfile: null,
  purchaseDate: null,
  purchasePrice: null,
  homeGrowthProfile: 'medium',
  vehicleDepreciationProfile: null,
  linkedLiabilityId: null,
  plaidAccountId: null,
  lastValueUpdatedAt: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

const plannerData = (overrides: Partial<PlannerLoadResult> = {}): PlannerLoadResult => ({
  people: [person()],
  accounts: [account()],
  inflationRate: 3,
  safeWithdrawalRate: 4,
  currencyCode: 'USD',
  returnDisplayMode: 'real',
  ...overrides,
});

describe('usePlannerHydration', () => {
  beforeEach(() => {
    fetchState.data = null;
    finance.assetDetails = {};
    Object.values(setters).forEach((mock) => mock.mockReset());
    setters.setPlannerAssetFinanceDetailsByAccountId.mockImplementation((updater: unknown) => {
      finance.assetDetails =
        typeof updater === 'function'
          ? (
              updater as (
                prev: Record<string, AssetFinanceDetails>,
              ) => Record<string, AssetFinanceDetails>
            )({})
          : (updater as Record<string, AssetFinanceDetails>);
    });
  });

  it('does nothing until planner data arrives', () => {
    const { result } = renderHook(() => usePlannerHydration());

    expect(result.current.plannerData).toBeNull();
    expect(setters.setPlannerAccounts).not.toHaveBeenCalled();
    expect(setters.setInflationRate).not.toHaveBeenCalled();
  });

  it('hydrates accounts, people, and user preferences', () => {
    const data = plannerData();
    fetchState.data = data;

    renderHook(() => usePlannerHydration());

    expect(setters.setPlannerAccounts).toHaveBeenCalledWith(data.accounts);
    expect(setters.setPlannerPeople).toHaveBeenCalledWith(data.people);
    expect(setters.setInflationRate).toHaveBeenCalledWith(3);
    expect(setters.setSafeWithdrawalRate).toHaveBeenCalledWith(4);
    expect(setters.setCurrencyCode).toHaveBeenCalledWith('USD');
  });

  it('keeps existing people when the API returns none', () => {
    fetchState.data = plannerData({ people: [] });

    renderHook(() => usePlannerHydration());

    expect(setters.setPlannerPeople).not.toHaveBeenCalled();
    expect(setters.setPlannerAccounts).toHaveBeenCalled();
  });

  it('only creates finance details for accounts with a profile or linked loan', () => {
    const liability = account({
      id: 'mort1',
      name: 'Mortgage',
      accountType: 'mortgage',
      startingBalance: 300_000,
      annualRate: 6.25,
      contributionValue: 2_000,
      homeGrowthProfile: null,
      linkedLiabilityId: null,
      originalLoanAmount: 450_000,
    });
    fetchState.data = plannerData({
      accounts: [
        account({ linkedLiabilityId: 'mort1' }),
        account({ id: 'checking1', accountType: 'checking', homeGrowthProfile: null }),
        liability,
      ],
    });

    renderHook(() => usePlannerHydration());

    expect(Object.keys(finance.assetDetails).sort()).toEqual(['home1']);
    expect(finance.assetDetails.home1).toMatchObject({
      hasLoan: true,
      currentLoanBalance: 300_000,
      loanInterestRate: 6.25,
      loanMonthlyPayment: 2_000,
      originalLoanAmount: 450_000,
    });
    expect(finance.assetDetails.checking1).toBeUndefined();
  });

  it('falls back to the computed original loan amount when the liability omits it', () => {
    fetchState.data = plannerData({
      accounts: [
        account({ linkedLiabilityId: 'mort1' }),
        account({
          id: 'mort1',
          accountType: 'mortgage',
          startingBalance: 300_000,
          homeGrowthProfile: null,
          originalLoanAmount: null,
        }),
      ],
    });

    renderHook(() => usePlannerHydration());

    expect(finance.assetDetails.home1.hasLoan).toBe(true);
    expect(finance.assetDetails.home1.originalLoanAmount).toBe(0);
  });

  it('ignores a linked liability that is not in the payload', () => {
    fetchState.data = plannerData({
      accounts: [account({ linkedLiabilityId: 'missing' })],
    });

    renderHook(() => usePlannerHydration());

    expect(finance.assetDetails.home1.hasLoan).toBe(false);
  });

  it('does not re-hydrate when the data fingerprint is unchanged', () => {
    fetchState.data = plannerData();

    const { rerender } = renderHook(() => usePlannerHydration());
    expect(setters.setPlannerAccounts).toHaveBeenCalledTimes(1);

    // New object, identical fingerprint: the effect runs but bails early.
    fetchState.data = plannerData();
    rerender();

    expect(setters.setPlannerAccounts).toHaveBeenCalledTimes(1);
    expect(setters.setInflationRate).toHaveBeenCalledTimes(1);
  });

  it('re-hydrates when the fingerprint changes', () => {
    fetchState.data = plannerData();

    const { rerender } = renderHook(() => usePlannerHydration());
    expect(setters.setPlannerAccounts).toHaveBeenCalledTimes(1);

    fetchState.data = plannerData({ inflationRate: 4.5 });
    rerender();

    expect(setters.setPlannerAccounts).toHaveBeenCalledTimes(2);
    expect(setters.setInflationRate).toHaveBeenLastCalledWith(4.5);
  });

  it('returns the planner data to callers', () => {
    const data = plannerData();
    fetchState.data = data;

    const { result } = renderHook(() => usePlannerHydration());

    expect(result.current.plannerData).toBe(data);
  });
});
