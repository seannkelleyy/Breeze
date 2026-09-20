import { describe, it, expect } from 'vitest';
import {
  getPaychecksPerYear,
  getPersonBaseAnnualIncome,
  getPersonBonusPerYear,
  getPersonTotalIncome,
  getPersonPaydaysForMonth,
  getPersonPaycheckAmount,
} from '../plannerMath';
import { PayCadence, PlannerPerson } from '../../types/person';

const makePerson = (overrides: Partial<PlannerPerson> = {}): PlannerPerson => ({
  id: 'p1',
  name: 'Test',
  birthday: '1990-01-01',
  retirementAge: 65,
  annualSalary: 120000,
  bonusMode: 'dollars',
  bonusFrequency: 'annual',
  annualBonus: 0,
  incomeGrowthRate: 0,
  isPrimary: true,
  payType: 'salary',
  payDay: 1,
  payCadence: 'biweekly',
  hourlyRate: 0,
  expectedHoursPerWeek: 0,
  createdAt: '',
  updatedAt: '',
  ...overrides,
});

// July 2026: July 1 is a Wednesday. Mondays: 6, 13, 20, 27. Sundays: 5, 12, 19, 26.
describe('getPersonPaydaysForMonth (July 2026)', () => {
  it('weekly Monday pays every Monday', () => {
    const person = makePerson({ payCadence: 'weekly', payDay: 1 });
    const days = getPersonPaydaysForMonth(person, 2026, 6).map((d) => d.getDate());
    expect(days).toEqual([6, 13, 20, 27]);
  });

  it('biweekly anchors to the first matching weekday of the year and steps 14 days', () => {
    // Jan 1 2026 is a Thursday -> first Monday is Jan 5. Jan 5 + 26 weeks = Jul 6.
    const person = makePerson({ payCadence: 'biweekly', payDay: 1 });
    const days = getPersonPaydaysForMonth(person, 2026, 6).map((d) => d.getDate());
    expect(days).toEqual([6, 20]);
  });

  it('biweekly with an invalid weekday returns no paydays', () => {
    const person = makePerson({ payCadence: 'biweekly', payDay: 15 });
    expect(getPersonPaydaysForMonth(person, 2026, 6)).toEqual([]);
  });

  it('semimonthly pays payDay and payDay + 15', () => {
    const person = makePerson({ payCadence: 'semimonthly', payDay: 15 });
    const days = getPersonPaydaysForMonth(person, 2026, 6).map((d) => d.getDate());
    expect(days).toEqual([15, 30]);
  });

  it('semimonthly clamps the second payday to the month length', () => {
    const person = makePerson({ payCadence: 'semimonthly', payDay: 20 });
    const days = getPersonPaydaysForMonth(person, 2026, 6).map((d) => d.getDate());
    expect(days).toEqual([20, 31]);
  });

  it('monthly clamps to the month length', () => {
    const person = makePerson({ payCadence: 'monthly', payDay: 31 });
    const days = getPersonPaydaysForMonth(person, 2026, 5).map((d) => d.getDate()); // June
    expect(days).toEqual([30]);
  });
});

describe('getPaychecksPerYear', () => {
  it.each([
    ['weekly', 52],
    ['biweekly', 26],
    ['semimonthly', 24],
    ['monthly', 12],
  ] as [PayCadence, number][])('returns %s -> %i', (cadence, expected) => {
    expect(getPaychecksPerYear(cadence)).toBe(expected);
  });
});

describe('income helpers', () => {
  it('computes salary income with no bonus', () => {
    const person = makePerson({ annualSalary: 120000, annualBonus: 0 });
    expect(getPersonTotalIncome(person)).toBe(120000);
    expect(getPersonBonusPerYear(person)).toBe(0);
  });

  it('computes fixed bonuses at their annual equivalent regardless of frequency', () => {
    const person = makePerson({
      annualSalary: 120000,
      annualBonus: 10000,
      bonusFrequency: 'quarterly',
    });
    expect(getPersonBonusPerYear(person)).toBe(10000);
    expect(getPersonTotalIncome(person)).toBe(130000);
  });

  it('normalizes percent bonuses by frequency', () => {
    const person = makePerson({
      annualSalary: 120000,
      bonusMode: 'salary-percent',
      annualBonus: 10,
      bonusFrequency: 'quarterly',
    });
    // 10% of salary, 4 times a year = 40% of salary
    expect(getPersonBonusPerYear(person)).toBe(48000);
    expect(getPersonTotalIncome(person)).toBe(168000);
  });

  it('computes hourly base income as rate × hours × 52', () => {
    const person = makePerson({ payType: 'hourly', hourlyRate: 50, expectedHoursPerWeek: 40 });
    expect(getPersonBaseAnnualIncome(person)).toBe(104000);
  });

  it('computes the per-paycheck amount', () => {
    const person = makePerson({ annualSalary: 120000, payCadence: 'semimonthly' });
    expect(getPersonPaycheckAmount(person)).toBe(5000);
  });
});
