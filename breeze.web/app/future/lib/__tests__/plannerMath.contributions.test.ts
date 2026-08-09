import { describe, it, expect } from 'vitest';
import {
  getTotalAnnualIncome,
  getEmployeeMonthlyContribution,
  getEmployerMatchMonthly,
  getSuggestedAnnualLimit,
  getIrsLimitKeyFromApiType,
} from '../plannerMath';
import { PLANNER_DEFAULT_IRS_LIMITS } from '../constants';
import type { PlannerAccount } from '../../types/account';
import type { PlannerPerson } from '../../types/person';

const makeAccount = (overrides: Partial<PlannerAccount> = {}): PlannerAccount => ({
  id: 'test-id',
  name: 'Test Account',
  personIds: ['person-1'],
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
  ...overrides,
});

const makePerson = (overrides: Partial<PlannerPerson> = {}): PlannerPerson => ({
  id: 'person-1',
  name: 'Self',
  birthday: '1990-01-01',
  retirementAge: 60,
  annualSalary: 120000,
  bonusMode: 'dollars',
  annualBonus: 5000,
  incomeGrowthRate: 3,
  ...overrides,
});

describe('getTotalAnnualIncome', () => {
  it('returns 0 for undefined person', () => {
    expect(getTotalAnnualIncome(undefined)).toBe(0);
  });

  it('adds salary and dollar bonus', () => {
    const person = makePerson({ annualSalary: 120000, annualBonus: 5000, bonusMode: 'dollars' });
    expect(getTotalAnnualIncome(person)).toBe(125000);
  });

  it('excludes salary-percent bonus from total', () => {
    const person = makePerson({
      annualSalary: 120000,
      annualBonus: 10,
      bonusMode: 'salary-percent',
    });
    expect(getTotalAnnualIncome(person)).toBe(120000);
  });

  it('handles zero salary', () => {
    const person = makePerson({ annualSalary: 0, annualBonus: 0 });
    expect(getTotalAnnualIncome(person)).toBe(0);
  });
});

describe('getEmployeeMonthlyContribution', () => {
  const people = [makePerson()];

  it('returns 0 for non-contributing account types', () => {
    const account = makeAccount({ accountType: 'home' });
    expect(getEmployeeMonthlyContribution(account, people)).toBe(0);
  });

  it('returns 0 for vehicle', () => {
    const account = makeAccount({ accountType: 'vehicle' });
    expect(getEmployeeMonthlyContribution(account, people)).toBe(0);
  });

  it('calculates monthly contribution mode', () => {
    const account = makeAccount({
      contributionMode: 'monthly',
      contributionValue: 500,
    });
    expect(getEmployeeMonthlyContribution(account, people)).toBe(500);
  });

  it('calculates yearly contribution mode', () => {
    const account = makeAccount({
      contributionMode: 'yearly',
      contributionValue: 12000,
    });
    expect(getEmployeeMonthlyContribution(account, people)).toBe(1000);
  });

  it('calculates salary-percent contribution mode', () => {
    const account = makeAccount({
      contributionMode: 'salary-percent',
      contributionValue: 10, // 10%
    });
    // 120000 * 0.10 / 12 = 1000
    expect(getEmployeeMonthlyContribution(account, people)).toBe(1000);
  });

  it('uses spouse income when account belongs to second person', () => {
    const people = [
      makePerson({ id: 'person-1', annualSalary: 120000 }),
      makePerson({ id: 'person-2', annualSalary: 80000 }),
    ];
    const account = makeAccount({
      personIds: ['person-2'],
      contributionMode: 'salary-percent',
      contributionValue: 10,
    });
    // 80000 * 0.10 / 12 = 666.67
    const result = getEmployeeMonthlyContribution(account, people);
    expect(result).toBeCloseTo(666.67, 0);
  });
});

describe('getEmployerMatchMonthly', () => {
  const people = [makePerson()];

  it('returns 0 when match rate is 0', () => {
    const account = makeAccount({ employerMatchRate: 0 });
    expect(getEmployerMatchMonthly(account, people)).toBe(0);
  });

  it('calculates 50% match up to 6% of salary', () => {
    const account = makeAccount({
      employerMatchRate: 50,
      employerMatchMaxPercentOfSalary: 6,
      contributionMode: 'monthly',
      contributionValue: 1000, // $1000/mo = $12000/yr
    });
    // Employee annual: 12000
    // Matchable: 120000 * 0.06 = 7200
    // Eligible: min(12000, 7200) = 7200
    // Annual match: 7200 * 0.50 = 3600
    // Monthly: 3600 / 12 = 300
    expect(getEmployerMatchMonthly(account, people)).toBeCloseTo(300, 0);
  });

  it('caps match at max percent of salary', () => {
    const account = makeAccount({
      employerMatchRate: 100,
      employerMatchMaxPercentOfSalary: 3,
      contributionMode: 'monthly',
      contributionValue: 2000, // $2000/mo = $24000/yr
    });
    // Matchable: 120000 * 0.03 = 3600
    // Eligible: min(24000, 3600) = 3600
    // Annual match: 3600 * 1.00 = 3600
    // Monthly: 3600 / 12 = 300
    expect(getEmployerMatchMonthly(account, people)).toBeCloseTo(300, 0);
  });
});

describe('getSuggestedAnnualLimit', () => {
  it('returns 401k limit for under 50', () => {
    const limit = getSuggestedAnnualLimit('401k', 30, PLANNER_DEFAULT_IRS_LIMITS, false);
    expect(limit).toBe(24500);
  });

  it('adds catch-up for 401k at age 50+', () => {
    const limit = getSuggestedAnnualLimit('401k', 50, PLANNER_DEFAULT_IRS_LIMITS, false);
    expect(limit).toBe(24500 + 8000);
  });

  it('returns Roth IRA limit', () => {
    const limit = getSuggestedAnnualLimit('roth-ira', 30, PLANNER_DEFAULT_IRS_LIMITS, false);
    expect(limit).toBe(7500);
  });

  it('adds catch-up for Roth IRA at 50+', () => {
    const limit = getSuggestedAnnualLimit('roth-ira', 50, PLANNER_DEFAULT_IRS_LIMITS, false);
    expect(limit).toBe(7500 + 1100);
  });

  it('returns HSA individual limit', () => {
    const limit = getSuggestedAnnualLimit('hsa', 30, PLANNER_DEFAULT_IRS_LIMITS, false);
    expect(limit).toBe(4400);
  });

  it('returns HSA family limit when inclSpouse', () => {
    const limit = getSuggestedAnnualLimit('hsa', 30, PLANNER_DEFAULT_IRS_LIMITS, true);
    expect(limit).toBe(8750);
  });

  it('adds catch-up for HSA at 55+', () => {
    const limit = getSuggestedAnnualLimit('hsa', 55, PLANNER_DEFAULT_IRS_LIMITS, false);
    expect(limit).toBe(4400 + 1000);
  });

  it('returns 0 for non-IRS account types', () => {
    expect(getSuggestedAnnualLimit('brokerage', 30, PLANNER_DEFAULT_IRS_LIMITS, false)).toBe(0);
    expect(getSuggestedAnnualLimit('checking', 30, PLANNER_DEFAULT_IRS_LIMITS, false)).toBe(0);
  });
});

describe('getIrsLimitKeyFromApiType', () => {
  it('maps 401k, 403b, 457 to 401k', () => {
    expect(getIrsLimitKeyFromApiType('401k')).toBe('401k');
    expect(getIrsLimitKeyFromApiType('403b')).toBe('401k');
    expect(getIrsLimitKeyFromApiType('457')).toBe('401k');
  });

  it('maps roth-ira to roth-ira', () => {
    expect(getIrsLimitKeyFromApiType('roth-ira')).toBe('roth-ira');
  });

  it('maps traditional-ira to traditional-ira', () => {
    expect(getIrsLimitKeyFromApiType('traditional-ira')).toBe('traditional-ira');
  });

  it('maps hsa to hsa', () => {
    expect(getIrsLimitKeyFromApiType('hsa')).toBe('hsa');
  });

  it('returns null for non-IRS types', () => {
    expect(getIrsLimitKeyFromApiType('brokerage')).toBeNull();
    expect(getIrsLimitKeyFromApiType('checking')).toBeNull();
    expect(getIrsLimitKeyFromApiType('home')).toBeNull();
  });
});
