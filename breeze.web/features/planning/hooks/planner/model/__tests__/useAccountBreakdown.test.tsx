import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';

import type { PlannerAccount } from '@/features/planning/types/account';
import type { PlannerPerson } from '@/features/planning/types/person';
import {
  defaultIrsLimits,
  getAgeFromBirthday,
  getSuggestedAnnualLimit,
} from '@/features/planning/lib/plannerMath';
import { useAccountBreakdown } from '../useAccountBreakdown';
import type { Household } from '../types';

const person = (overrides: Partial<PlannerPerson> = {}): PlannerPerson => ({
  id: 'p1',
  name: 'Alex',
  birthday: '1986-01-01',
  retirementAge: 65,
  annualSalary: 120_000,
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
  id: 'k1',
  name: 'Employer 401(k)',
  personIds: ['p1'],
  accountType: '401k',
  contributionMode: 'monthly',
  contributionValue: 500,
  employerMatchRate: 50,
  employerMatchMaxPercentOfSalary: 6,
  startingBalance: 50_000,
  annualRate: 7,
  returnProfile: null,
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

const household: Household = {
  people: [person()],
  currentAge: 40,
  targetAge: 65,
  yearsToGoal: 25,
  annualHouseholdIncome: 120_000,
};

describe('useAccountBreakdown', () => {
  it('labels the owner and computes contributions, match, and suggested limit', () => {
    const people = [person()];
    const age = getAgeFromBirthday(people[0].birthday);

    const { result } = renderHook(() =>
      useAccountBreakdown([account()], household, people, defaultIrsLimits, [123_456]),
    );

    const [row] = result.current;
    expect(row).toMatchObject({
      id: 'k1',
      name: 'Employer 401(k)',
      ownerLabel: 'Alex',
      accountTypeLabel: '401(k)',
      employeeMonthly: 500,
      // $500/mo = $6k/yr, matched 50% up to 6% of $120k.
      matchMonthly: 250,
      totalMonthly: 750,
      annualEmployee: 6_000,
      exceedsLimit: false,
      projectedValue: 123_456,
    });
    expect(row.suggestedLimit).toBe(getSuggestedAnnualLimit('401k', age, defaultIrsLimits, false));
    expect(row.suggestedLimit).toBeGreaterThan(0);
  });

  it('flags contributions above the suggested IRS limit', () => {
    const { result } = renderHook(() =>
      useAccountBreakdown(
        [account({ contributionValue: 5_000 })],
        household,
        [person()],
        defaultIrsLimits,
        [],
      ),
    );

    expect(result.current[0].annualEmployee).toBe(60_000);
    expect(result.current[0].exceedsLimit).toBe(true);
  });

  it('treats accounts with no owners as unassigned and falls back to household age', () => {
    const { result } = renderHook(() =>
      useAccountBreakdown(
        [account({ personIds: [] })],
        household,
        [person()],
        defaultIrsLimits,
        [],
      ),
    );

    expect(result.current[0].ownerLabel).toBe('Unassigned');
    expect(result.current[0].projectedValue).toBe(0);
  });

  it('labels unknown account types as Other and skips employer match at zero rate', () => {
    const { result } = renderHook(() =>
      useAccountBreakdown(
        [
          account({
            accountType: 'other',
            employerMatchRate: 0,
            personIds: [],
          }),
        ],
        household,
        [person()],
        defaultIrsLimits,
        [],
      ),
    );

    expect(result.current[0].accountTypeLabel).toBe('Other');
    expect(result.current[0].matchMonthly).toBe(0);
  });
});
