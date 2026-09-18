import { describe, it, expect } from 'vitest';
import type { PlannerAccount } from '../../types/account';
import type { PlannerPerson } from '../../types/person';
import type { PlannerSummary } from '../../types/planner';
import { PLANNER_DEFAULT_IRS_LIMITS } from '../constants';
import { getProjection } from '../plannerMath';

const person: PlannerPerson = {
  id: 'p1',
  name: 'Test Person',
  birthday: '1990-06-15',
  retirementAge: 65,
  annualSalary: 120000,
  bonusMode: 'dollars',
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
};

const account = (overrides: Partial<PlannerAccount> = {}): PlannerAccount => ({
  id: 'a1',
  name: 'Test Account',
  personIds: ['p1'],
  accountType: 'brokerage',
  contributionMode: 'monthly',
  contributionValue: 0,
  employerMatchRate: 0,
  employerMatchMaxPercentOfSalary: 0,
  startingBalance: 0,
  annualRate: 0,
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

const call = (
  accounts: PlannerAccount[],
  currentAge: number,
  targetAge: number,
  options: {
    people?: PlannerPerson[];
    inflationRatePercent?: number;
    useInflationAdjustedValues?: boolean;
    projectionEndAge?: number;
    annualWithdrawal?: number;
  } = {},
) =>
  getProjection(
    accounts,
    currentAge,
    targetAge,
    options.people ?? [person],
    {},
    PLANNER_DEFAULT_IRS_LIMITS,
    2.5,
    options.inflationRatePercent ?? 0,
    options.useInflationAdjustedValues ?? false,
    options.projectionEndAge,
    options.annualWithdrawal,
  );

describe('getProjection', () => {
  it('returns a single row when currentAge equals targetAge', () => {
    const { projectionRows, finalBalances } = call([account({ startingBalance: 5000 })], 65, 65);

    expect(projectionRows).toHaveLength(1);
    expect(projectionRows[0].age).toBe(65);
    expect(projectionRows[0].totalBalance).toBe(5000);
    expect(finalBalances).toEqual([5000]);
  });

  it('applies monthly compound growth without contributions', () => {
    // 12% annual nominal, 0% inflation, nominal display → 1% monthly
    const { projectionRows } = call([account({ startingBalance: 12000, annualRate: 12 })], 30, 31);

    const expected = 12000 * Math.pow(1.01, 12);
    expect(projectionRows).toHaveLength(2);
    expect(projectionRows[1]['account-0']).toBeCloseTo(expected, 2);
    expect(projectionRows[1].totalBalance).toBeCloseTo(expected, 2);
    expect(projectionRows[1].totalContributions).toBe(0);
  });

  it('adds monthly contributions on top of growth', () => {
    const { projectionRows } = call(
      [account({ startingBalance: 12000, annualRate: 12, contributionValue: 100 })],
      30,
      31,
    );

    const growthFactor = Math.pow(1.01, 12);
    const expected = 12000 * growthFactor + 100 * ((growthFactor - 1) / 0.01);
    expect(projectionRows[1]['account-0']).toBeCloseTo(expected, 2);
    expect(projectionRows[1].totalContributions).toBeCloseTo(1200, 6);
  });

  it('uses the real (inflation-adjusted) rate when enabled', () => {
    const { projectionRows } = call(
      [account({ startingBalance: 12000, annualRate: 12 })],
      30,
      31,
      { inflationRatePercent: 2.5, useInflationAdjustedValues: true },
    );

    const realRate = ((1 + 12 / 100) / (1 + 2.5 / 100) - 1) * 100;
    const expected = 12000 * Math.pow(1 + realRate / 100 / 12, 12);
    expect(projectionRows[1]['account-0']).toBeCloseTo(expected, 2);
  });

  it('carries liability balances as negative values', () => {
    const { projectionRows, finalBalances } = call(
      [account({ accountType: 'credit-card', startingBalance: 5000 })],
      30,
      31,
    );

    expect(projectionRows[1]['account-0']).toBe(-5000);
    expect(projectionRows[1].totalBalance).toBe(-5000);
    expect(finalBalances).toEqual([-5000]);
  });

  it('aggregates multiple accounts into totalBalance with per-account columns', () => {
    const { projectionRows } = call(
      [account({ id: 'a1', startingBalance: 10000 }), account({ id: 'a2', startingBalance: 5000 })],
      30,
      31,
    );

    expect(projectionRows[1]['account-0']).toBe(10000);
    expect(projectionRows[1]['account-1']).toBe(5000);
    expect(projectionRows[1].totalBalance).toBe(15000);
  });

  it('projects a combined asset (home) at its equity value', () => {
    const home = account({ id: 'home1', accountType: 'home', startingBalance: 400000 });
    const { projectionRows } = call([home], 30, 31);

    // No AssetFinanceDetails provided → falls back to startingBalance, no growth runtime
    expect(projectionRows[1]['account-0']).toBe(400000);
  });
});

describe('getProjection — IRS limits', () => {
  const olderPerson: PlannerPerson = { ...person, birthday: '1950-06-15' };

  it('caps 401k employee contributions at the annual IRS limit', () => {
    // Monthly 10000 → 120000/yr attempted; catch-up age limit (24500 + 8000 = 32500) applies
    const { projectionRows } = call(
      [
        account({
          accountType: '401k',
          contributionValue: 10000,
          startingBalance: 0,
          annualRate: 0,
        }),
      ],
      70,
      71,
      { people: [olderPerson] },
    );

    expect(projectionRows[1]['account-0']).toBeCloseTo(32500, 6);
    expect(projectionRows[1].totalContributions).toBeCloseTo(32500, 6);
  });

  it('does not cap contributions below the limit', () => {
    const { projectionRows } = call(
      [account({ accountType: '401k', contributionValue: 500, startingBalance: 0, annualRate: 0 })],
      70,
      71,
      { people: [olderPerson] },
    );

    expect(projectionRows[1].totalContributions).toBeCloseTo(6000, 6);
  });
});

describe('getProjection — employer match', () => {
  it('applies employer match on 401k contributions up to the salary cap', () => {
    // Employee: 500/mo = 6000/yr. Match: 100% up to 5% of 120000 = 6000 → 500/mo
    const { projectionRows } = call(
      [
        account({
          accountType: '401k',
          contributionValue: 500,
          employerMatchRate: 100,
          employerMatchMaxPercentOfSalary: 5,
          startingBalance: 0,
          annualRate: 0,
        }),
      ],
      30,
      31,
    );

    expect(projectionRows[1]['account-0']).toBeCloseTo(12000, 6);
    expect(projectionRows[1].totalContributions).toBeCloseTo(12000, 6);
  });

  it('never applies employer match to non-401k accounts', () => {
    const { projectionRows } = call(
      [
        account({
          accountType: 'brokerage',
          contributionValue: 500,
          employerMatchRate: 100,
          employerMatchMaxPercentOfSalary: 5,
          startingBalance: 0,
          annualRate: 0,
        }),
      ],
      30,
      31,
    );

    expect(projectionRows[1]['account-0']).toBeCloseTo(6000, 6);
    expect(projectionRows[1].totalContributions).toBeCloseTo(6000, 6);
  });
});

describe('getProjection — post-retirement withdrawals', () => {
  it('stops contributions and withdraws after the target age', () => {
    const { projectionRows } = call(
      [account({ startingBalance: 100000, annualRate: 0 })],
      64,
      65,
      { projectionEndAge: 66, annualWithdrawal: 12000 },
    );

    expect(projectionRows).toHaveLength(3);
    // Age 65: final accumulation year, no withdrawal
    expect(projectionRows[1].age).toBe(65);
    expect(projectionRows[1].totalBalance).toBeCloseTo(100000, 6);
    // Age 66: post-retirement, withdraw 12000/yr with 0% inflation
    expect(projectionRows[2].age).toBe(66);
    expect(projectionRows[2].totalBalance).toBeCloseTo(88000, 2);
  });

  it('does not withdraw when no annual withdrawal is provided', () => {
    const { projectionRows } = call(
      [account({ startingBalance: 100000, annualRate: 0 })],
      64,
      65,
      { projectionEndAge: 66 },
    );

    expect(projectionRows[2].totalBalance).toBeCloseTo(100000, 6);
  });

  it('scales withdrawals by inflation for each post-retirement year', () => {
    const { projectionRows } = call(
      [account({ startingBalance: 100000, annualRate: 0 })],
      63,
      64,
      { projectionEndAge: 66, annualWithdrawal: 12000, inflationRatePercent: 10 },
    );

    // Year 2 (age 65→66): withdrawal = 12000 * 1.1^1
    expect(projectionRows[2].totalBalance).toBeCloseTo(100000 - 13200, 2);
  });
});
