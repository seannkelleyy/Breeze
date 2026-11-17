import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';

import type { PlannerAccount } from '@/features/planning/types/account';
import type { PlannerPerson } from '@/features/planning/types/person';
import { defaultIrsLimits } from '@/features/planning/lib/plannerMath';
import { useProjections } from '../useProjections';
import type { Household } from '../types';

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
  id: 'a1',
  name: 'Brokerage',
  personIds: ['p1'],
  accountType: 'brokerage',
  contributionMode: 'monthly',
  contributionValue: 1_000,
  employerMatchRate: 0,
  employerMatchMaxPercentOfSalary: 0,
  startingBalance: 100_000,
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

const household = (overrides: Partial<Household> = {}): Household => ({
  people: [person()],
  currentAge: 40,
  targetAge: 65,
  yearsToGoal: 25,
  annualHouseholdIncome: 100_000,
  ...overrides,
});

describe('useProjections', () => {
  it('projects through the target age and reports the target-row balance', () => {
    const h = household();
    const { result } = renderHook(() =>
      useProjections([account()], h, {}, defaultIrsLimits, 3, false),
    );

    expect(result.current.projectionRows[0].age).toBe(40);
    expect(result.current.projectionRows.at(-1)?.age).toBe(65);
    expect(result.current.projectedNetWorthAtTargetAge).toBeGreaterThan(100_000);
    expect(result.current.finalBalances).toHaveLength(1);
    expect(result.current.finalBalances[0]).toBe(result.current.projectedNetWorthAtTargetAge);
  });

  it('keeps target-age stats stable when the chart extends past retirement', () => {
    const h = household();
    const base = renderHook(() => useProjections([account()], h, {}, defaultIrsLimits, 3, false));
    const extended = renderHook(() =>
      useProjections([account()], h, {}, defaultIrsLimits, 3, false, 80),
    );

    expect(extended.result.current.projectionRows.at(-1)?.age).toBe(80);
    expect(extended.result.current.projectedNetWorthAtTargetAge).toBe(
      base.result.current.projectedNetWorthAtTargetAge,
    );
  });

  it('reports weighted average portfolio rates for each scope', () => {
    const h = household();
    const { result } = renderHook(() =>
      useProjections([account()], h, {}, defaultIrsLimits, 3, false),
    );

    expect(result.current.portfolioAverageRates.all).toBeCloseTo(7, 6);
    expect(result.current.portfolioAverageRates.investable).toBeCloseTo(7, 6);
    expect(result.current.portfolioAverageRates.property).toBeNull();
  });

  it('returns an empty balance list for an empty portfolio', () => {
    const h = household();
    const { result } = renderHook(() => useProjections([], h, {}, defaultIrsLimits, 3, false));

    expect(result.current.finalBalances).toEqual([]);
    expect(result.current.projectedNetWorthAtTargetAge).toBe(0);
    expect(result.current.projectionRows.length).toBeGreaterThan(0);
  });
});
