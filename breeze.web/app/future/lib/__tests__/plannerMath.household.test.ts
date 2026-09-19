import { describe, it, expect } from 'vitest';
import {
  clamp,
  toIsoDate,
  getAgeFromBirthday,
  getPersonsAnnualIncome,
  getPlannerHouseholdSnapshot,
  getTotalMonthlyForAccount,
  getPlannerContributionTotals,
} from '../plannerMath';
import type { PlannerAccount } from '../../types/account';
import type { PlannerPerson } from '../../types/person';

const makeAccount = (overrides: Partial<PlannerAccount> = {}): PlannerAccount => ({
  id: 'a1',
  name: 'Test Account',
  personIds: ['p1'],
  accountType: '401k',
  contributionMode: 'monthly',
  contributionValue: 500,
  employerMatchRate: 50,
  employerMatchMaxPercentOfSalary: 6,
  startingBalance: 100000,
  annualRate: 7,
  returnProfile: null,
  purchaseDate: null,
  purchasePrice: null,
  homeGrowthProfile: null,
  vehicleDepreciationProfile: null,
  linkedLiabilityId: null,
  plaidAccountId: null,
  lastValueUpdatedAt: null,
  createdAt: '',
  updatedAt: '',
  ...overrides,
});

const makePerson = (overrides: Partial<PlannerPerson> = {}): PlannerPerson => ({
  id: 'p1',
  name: 'Self',
  birthday: '1990-01-01',
  retirementAge: 65,
  annualSalary: 120000,
  bonusMode: 'dollars',
  bonusFrequency: 'annual' as const,
      annualBonus: 5000,
  incomeGrowthRate: 3,
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

describe('clamp', () => {
  it('passes through finite values above the minimum', () => {
    expect(clamp(42)).toBe(42);
    expect(clamp(0)).toBe(0);
  });

  it('clamps negatives to 0 by default', () => {
    expect(clamp(-5)).toBe(0);
  });

  it('honors a custom minimum', () => {
    expect(clamp(-5, -10)).toBe(-5);
    expect(clamp(-20, -10)).toBe(-10);
  });

  it('returns the minimum for non-finite values', () => {
    expect(clamp(NaN)).toBe(0);
    expect(clamp(Infinity)).toBe(0);
    expect(clamp(-Infinity)).toBe(0);
    expect(clamp(NaN, -10)).toBe(-10);
  });
});

describe('toIsoDate', () => {
  it('formats with zero-padded month and day', () => {
    expect(toIsoDate(new Date(2026, 0, 9))).toBe('2026-01-09');
    expect(toIsoDate(new Date(2026, 11, 31))).toBe('2026-12-31');
  });
});

describe('getAgeFromBirthday', () => {
  // Birthdays are built relative to the real clock so the tests are stable on
  // any run date; getAgeFromBirthday reads new Date() internally.
  const now = new Date();

  it('computes age when the birthday has already passed this year', () => {
    const birthday = toIsoDate(
      new Date(now.getFullYear() - 40, now.getMonth(), Math.max(1, now.getDate() - 15)),
    );
    expect(getAgeFromBirthday(birthday)).toBe(40);
  });

  it('subtracts one when the birthday has not yet occurred this year', () => {
    const birthday = toIsoDate(new Date(now.getFullYear() - 40, now.getMonth() + 2, 15));
    expect(getAgeFromBirthday(birthday)).toBe(39);
  });

  it('defaults to 30 for an empty birthday', () => {
    expect(getAgeFromBirthday('')).toBe(30);
  });

  it('defaults to 30 for an unparseable birthday', () => {
    expect(getAgeFromBirthday('not-a-date')).toBe(30);
  });

  it('clamps future birthdays to 0', () => {
    const birthday = toIsoDate(new Date(now.getFullYear() + 4, now.getMonth(), now.getDate()));
    expect(getAgeFromBirthday(birthday)).toBe(0);
  });
});

describe('getPersonsAnnualIncome', () => {
  const people = [
    makePerson({ id: 'p1', annualSalary: 120000 }),
    makePerson({ id: 'p2', annualSalary: 80000 }),
  ];

  it('falls back to the first person when personIds is empty', () => {
    expect(getPersonsAnnualIncome([], people)).toBe(120000);
  });

  it('falls back to 0 when there are no people at all', () => {
    expect(getPersonsAnnualIncome([], [])).toBe(0);
  });

  it('sums salaries across all listed people', () => {
    expect(getPersonsAnnualIncome(['p1', 'p2'], people)).toBe(200000);
  });

  it('ignores ids that match no person', () => {
    expect(getPersonsAnnualIncome(['p1', 'missing'], people)).toBe(120000);
  });
});

describe('getPlannerHouseholdSnapshot', () => {
  it('sums total annual income across the household including dollar bonuses', () => {
    const people = [
      makePerson({ annualSalary: 120000, bonusFrequency: 'annual' as const,
      annualBonus: 5000, bonusMode: 'dollars' }),
      makePerson({
        id: 'p2',
        annualSalary: 80000,
        bonusFrequency: 'annual' as const,
      annualBonus: 10,
        bonusMode: 'salary-percent',
      }),
    ];
    const snapshot = getPlannerHouseholdSnapshot(people);
    // salary-percent bonuses are excluded from total income
    expect(snapshot.householdIncome).toBe(205000);
    expect(snapshot.annualHouseholdIncome).toBe(205000);
    expect(snapshot.people).toBe(people);
  });

  it('derives currentAge from the first person', () => {
    const snapshot = getPlannerHouseholdSnapshot([makePerson({ birthday: '1990-01-01' })]);
    expect(snapshot.currentAge).toBe(getAgeFromBirthday('1990-01-01'));
  });

  it('handles an empty household', () => {
    const snapshot = getPlannerHouseholdSnapshot([]);
    expect(snapshot.householdIncome).toBe(0);
    expect(snapshot.currentAge).toBe(30);
  });
});

describe('getTotalMonthlyForAccount', () => {
  it('combines employee contribution and employer match', () => {
    const account = makeAccount({
      contributionMode: 'monthly',
      contributionValue: 500,
      employerMatchRate: 50,
      employerMatchMaxPercentOfSalary: 6,
    });
    // Employee 500/mo = 6000/yr; matchable cap 120000 * 6% = 7200 → eligible 6000
    // Match 6000 * 50% / 12 = 250 → total 750
    expect(getTotalMonthlyForAccount(account, [makePerson()])).toBeCloseTo(750, 6);
  });
});

describe('getPlannerContributionTotals', () => {
  it('aggregates employee, match, and combined totals across accounts', () => {
    const accounts = [
      makeAccount({
        id: 'a1',
        contributionMode: 'monthly',
        contributionValue: 500,
        employerMatchRate: 50,
        employerMatchMaxPercentOfSalary: 6,
      }),
      makeAccount({
        id: 'a2',
        accountType: 'brokerage',
        contributionMode: 'monthly',
        contributionValue: 300,
        employerMatchRate: 0,
      }),
    ];
    const totals = getPlannerContributionTotals(accounts, [makePerson()]);

    expect(totals.totalPlannedMonthlyEmployee).toBeCloseTo(800, 6);
    expect(totals.totalPlannedMonthlyMatch).toBeCloseTo(250, 6);
    expect(totals.totalPlannedMonthlyInvestment).toBeCloseTo(1050, 6);
  });

  it('excludes non-contributing account types', () => {
    const totals = getPlannerContributionTotals(
      [makeAccount({ accountType: 'home', contributionValue: 1000 })],
      [makePerson()],
    );
    expect(totals.totalPlannedMonthlyEmployee).toBe(0);
    expect(totals.totalPlannedMonthlyMatch).toBe(0);
    expect(totals.totalPlannedMonthlyInvestment).toBe(0);
  });
});
