import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';

import type { PlannerPerson } from '@/features/planning/types/person';
import { getAgeFromBirthday } from '@/features/planning/lib/plannerMath';
import { useHouseholdCalculation } from '../useHouseholdCalculation';

const person = (overrides: Partial<PlannerPerson> = {}): PlannerPerson => ({
  id: 'p1',
  name: 'Alex',
  birthday: '1990-06-15',
  retirementAge: 65,
  annualSalary: 100_000,
  bonusMode: 'dollars',
  bonusFrequency: 'annual',
  annualBonus: 10_000,
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

describe('useHouseholdCalculation', () => {
  it('targets the latest retirement age and derives years to goal', () => {
    const people = [
      person(),
      person({
        id: 'p2',
        name: 'Sam',
        birthday: '1992-01-10',
        retirementAge: 67,
        annualSalary: 80_000,
        annualBonus: 0,
      }),
    ];

    const { result } = renderHook(() => useHouseholdCalculation(people));

    const currentAge = getAgeFromBirthday('1990-06-15');
    expect(result.current.currentAge).toBe(currentAge);
    expect(result.current.targetAge).toBe(67);
    expect(result.current.yearsToGoal).toBe(67 - currentAge);
    // Salary + bonus for both people.
    expect(result.current.annualHouseholdIncome).toBe(190_000);
    expect(result.current.people).toBe(people);
  });

  it('falls back to the default age with no people configured', () => {
    const { result } = renderHook(() => useHouseholdCalculation([]));

    expect(result.current.currentAge).toBe(30);
    expect(result.current.targetAge).toBe(30);
    expect(result.current.yearsToGoal).toBe(0);
    expect(result.current.annualHouseholdIncome).toBe(0);
  });

  it('clamps years to goal at zero when retirement age is in the past', () => {
    const { result } = renderHook(() => useHouseholdCalculation([person({ retirementAge: 20 })]));

    expect(result.current.targetAge).toBe(20);
    expect(result.current.yearsToGoal).toBe(0);
  });
});
