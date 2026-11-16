import { describe, it, expect, vi, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';

import {
  PLANNER_DEFAULT_DESIRED_INVESTMENT_AMOUNT,
  PLANNER_DEFAULT_RETIREMENT_METHOD,
} from '@/features/planning/lib/constants';
import type { PlannerPerson } from '@/features/planning/types/person';
import { PlannerStateProvider, usePlannerState } from '../PlannerStateProvider';

const person: PlannerPerson = {
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
};

const wrapper = ({ children }: { children: ReactNode }) => (
  <PlannerStateProvider>{children}</PlannerStateProvider>
);

describe('PlannerStateProvider', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts from the documented planner defaults', () => {
    const { result } = renderHook(() => usePlannerState(), { wrapper });

    expect(result.current.plannerPeople).toEqual([]);
    expect(result.current.plannerAccounts).toEqual([]);
    expect(result.current.plannerAssetFinanceDetailsByAccountId).toEqual({});
    expect(result.current.plannerSummary).toBeNull();
    expect(result.current.plannerDesiredInvestmentAmount).toBe(
      PLANNER_DEFAULT_DESIRED_INVESTMENT_AMOUNT,
    );
    expect(result.current.plannerRetirementMethod).toBe(PLANNER_DEFAULT_RETIREMENT_METHOD);
  });

  it('exposes setters that update the shared state', () => {
    const { result } = renderHook(() => usePlannerState(), { wrapper });

    act(() => {
      result.current.setPlannerPeople([person]);
      result.current.setPlannerDesiredInvestmentAmount(2_000_000);
      result.current.setPlannerRetirementMethod('fire');
      result.current.setPlannerAssetFinanceDetailsByAccountId({
        home1: {
          purchaseDate: '2020-01-01',
          purchasePrice: 500_000,
          currentValue: 600_000,
          annualChangeRate: 4,
          homeGrowthProfile: 'medium',
          vehicleDepreciationProfile: 'custom',
          hasLoan: false,
          loanInterestRate: 0.05,
          originalLoanAmount: 0,
          loanMonthlyPayment: 0,
          loanTermYears: 30,
          loanStartDate: '2020-01-01',
          currentLoanBalance: 0,
        },
      });
    });

    expect(result.current.plannerPeople).toEqual([person]);
    expect(result.current.plannerDesiredInvestmentAmount).toBe(2_000_000);
    expect(result.current.plannerRetirementMethod).toBe('fire');
    expect(Object.keys(result.current.plannerAssetFinanceDetailsByAccountId)).toEqual(['home1']);
  });

  it('throws a clear error when used outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => usePlannerState())).toThrow(
      'usePlannerState must be used within a PlannerStateProvider',
    );
  });
});
