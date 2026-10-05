import { describe, it, expect } from 'vitest';
import {
  getPersonBaseAnnualIncome,
  getPersonBonusPerYear,
  getPersonTotalIncome,
  getPersonsAnnualIncome,
} from '../income';
import type { PlannerPerson } from '@/app/future/types/person';

const person = (overrides: Partial<PlannerPerson> = {}): PlannerPerson => ({
  id: 'p1',
  name: 'Test',
  birthday: '1990-01-01',
  retirementAge: 65,
  annualSalary: 120000,
  bonusMode: 'dollars',
  bonusFrequency: 'annual' as const,
  annualBonus: 0,
  incomeGrowthRate: 0,
  isPrimary: true,
  payType: 'salary',
  payDay: 1,
  payCadence: 'biweekly' as const,
  hourlyRate: 0,
  expectedHoursPerWeek: 0,
  createdAt: '',
  updatedAt: '',
  ...overrides,
});

describe('lib/calc/income — storage contract: annualBonus is the annual-equivalent', () => {
  it('dollars mode: stored value IS the yearly total, frequency irrelevant', () => {
    const p = person({ annualBonus: 4000, bonusFrequency: 'quarterly' });
    expect(getPersonBonusPerYear(p)).toBe(4000);
    expect(getPersonTotalIncome(p)).toBe(124000);
  });

  it('percent mode: stored percent is the annual total, frequency irrelevant', () => {
    const p = person({ annualBonus: 10, bonusMode: 'salary-percent', bonusFrequency: 'quarterly' });
    expect(getPersonBonusPerYear(p)).toBe(12000);
    expect(getPersonTotalIncome(p)).toBe(132000);
  });

  it('hourly base feeds percent bonuses and totals', () => {
    const p = person({
      payType: 'hourly',
      hourlyRate: 50,
      expectedHoursPerWeek: 40,
      annualBonus: 10,
      bonusMode: 'salary-percent',
    });
    expect(getPersonBaseAnnualIncome(p)).toBe(104000);
    expect(getPersonTotalIncome(p)).toBe(114400);
  });

  it('getPersonsAnnualIncome sums owner salaries only, falling back to people[0]', () => {
    const a = person({ id: 'a', annualSalary: 90000 });
    const b = person({ id: 'b', annualSalary: 60000 });
    expect(getPersonsAnnualIncome(['a'], [a, b])).toBe(90000);
    expect(getPersonsAnnualIncome([], [a, b])).toBe(90000);
  });
});
