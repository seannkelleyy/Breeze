import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { PlannerAccount } from '../../types/account';
import type { PlannerPerson } from '../../types/person';
import type { AssetFinanceDetails } from '../../types/finance';
import { PLANNER_DEFAULT_IRS_LIMITS } from '../constants';
import { getProjection } from '../projection';

const person: PlannerPerson = {
  id: 'p1',
  name: 'Test Person',
  birthday: '1990-06-15',
  retirementAge: 65,
  annualSalary: 120000,
  bonusMode: 'dollars',
  bonusFrequency: 'annual' as const,
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
    details?: Record<string, AssetFinanceDetails>;
    inflationRatePercent?: number;
    useInflationAdjustedValues?: boolean;
    projectionEndAge?: number;
    annualWithdrawal?: number;
    annualIrsLimitGrowthRate?: number;
    annualReturnAdjustmentPercent?: number;
  } = {},
) =>
  getProjection(
    accounts,
    currentAge,
    targetAge,
    options.people ?? [person],
    options.details ?? {},
    PLANNER_DEFAULT_IRS_LIMITS,
    options.annualIrsLimitGrowthRate ?? 2.5,
    options.inflationRatePercent ?? 0,
    options.useInflationAdjustedValues ?? false,
    options.projectionEndAge,
    options.annualWithdrawal,
    options.annualReturnAdjustmentPercent,
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
    const { projectionRows } = call([account({ startingBalance: 12000, annualRate: 12 })], 30, 31, {
      inflationRatePercent: 2.5,
      useInflationAdjustedValues: true,
    });

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
    const { projectionRows } = call([account({ startingBalance: 100000, annualRate: 0 })], 64, 65, {
      projectionEndAge: 66,
      annualWithdrawal: 12000,
    });

    expect(projectionRows).toHaveLength(3);
    // Age 65: final accumulation year, no withdrawal
    expect(projectionRows[1].age).toBe(65);
    expect(projectionRows[1].totalBalance).toBeCloseTo(100000, 6);
    // Age 66: post-retirement, withdraw 12000/yr with 0% inflation
    expect(projectionRows[2].age).toBe(66);
    expect(projectionRows[2].totalBalance).toBeCloseTo(88000, 2);
  });

  it('does not withdraw when no annual withdrawal is provided', () => {
    const { projectionRows } = call([account({ startingBalance: 100000, annualRate: 0 })], 64, 65, {
      projectionEndAge: 66,
    });

    expect(projectionRows[2].totalBalance).toBeCloseTo(100000, 6);
  });

  it('scales withdrawals by inflation for each post-retirement year', () => {
    const { projectionRows } = call([account({ startingBalance: 100000, annualRate: 0 })], 63, 64, {
      projectionEndAge: 66,
      annualWithdrawal: 12000,
      inflationRatePercent: 10,
    });

    // Year 2 (age 65→66): withdrawal = 12000 * 1.1^1
    expect(projectionRows[2].totalBalance).toBeCloseTo(100000 - 13200, 2);
  });
});

const makeDetails = (overrides: Partial<AssetFinanceDetails> = {}): AssetFinanceDetails => ({
  purchaseDate: '2026-01-15',
  purchasePrice: 400000,
  currentValue: 450000,
  annualChangeRate: 4,
  homeGrowthProfile: 'medium',
  vehicleDepreciationProfile: 'medium',
  hasLoan: false,
  loanInterestRate: 6,
  originalLoanAmount: 0,
  loanMonthlyPayment: 0,
  loanTermYears: 30,
  loanStartDate: '2026-01-15',
  currentLoanBalance: 0,
  ...overrides,
});

describe('getProjection — combined assets (home/vehicle runtime)', () => {
  // The engine dates AssetFinanceDetails against new Date(); pin the clock so
  // monthsSincePurchase and loan elapsed months are deterministic.
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 15));
  });
  afterEach(() => vi.useRealTimers());

  it('starts a home with loan at equity and grows the asset at the profile rate', () => {
    const home = account({ id: 'home1', accountType: 'home', startingBalance: 999999 });
    const details = makeDetails({
      currentValue: 450000,
      homeGrowthProfile: 'medium', // 4%/yr
      hasLoan: true,
      loanInterestRate: 0,
      loanMonthlyPayment: 500,
      currentLoanBalance: 12000,
    });

    const { projectionRows } = call([home], 30, 31, { details: { home1: details } });

    // Row 0: equity = 450000 - 12000, not startingBalance
    expect(projectionRows[0]['account-0']).toBe(438000);
    // Row 1: asset compounded monthly at 4%/yr, loan drawn down 500/mo
    const expectedAsset = 450000 * Math.pow(1 + 4 / 100 / 12, 12);
    expect(projectionRows[1]['account-0']).toBeCloseTo(expectedAsset - 6000, 2);
    expect(projectionRows[1].totalBalance).toBeCloseTo(expectedAsset - 6000, 2);
  });

  it('counts loan payments toward totalContributions', () => {
    const home = account({ id: 'home1', accountType: 'home' });
    const details = makeDetails({
      homeGrowthProfile: 'none',
      hasLoan: true,
      loanInterestRate: 0,
      loanMonthlyPayment: 500,
      currentLoanBalance: 12000,
    });

    const { projectionRows } = call([home], 30, 31, { details: { home1: details } });

    expect(projectionRows[1].totalContributions).toBeCloseTo(6000, 6);
  });

  it('accrues loan interest monthly and clamps the balance at 0 once paid off', () => {
    const home = account({ id: 'home1', accountType: 'home' });
    const details = makeDetails({
      homeGrowthProfile: 'none',
      hasLoan: true,
      loanInterestRate: 12, // 1%/mo
      loanMonthlyPayment: 500,
      currentLoanBalance: 1200,
    });

    const { projectionRows } = call([home], 30, 31, { details: { home1: details } });

    // 1200 at 1%/mo with 500/mo payments: 709, 206, then overshoots → clamped to 0
    let loan = 1200;
    let monthsPaid = 0;
    while (loan > 0 && monthsPaid < 12) {
      loan = Math.max(0, loan * 1.01 - 500);
      monthsPaid++;
    }
    expect(loan).toBe(0);
    expect(monthsPaid).toBe(3);
    expect(projectionRows[1]['account-0']).toBeCloseTo(450000, 6); // asset - 0 loan
    // Payment counted only for months the loan was outstanding
    expect(projectionRows[1].totalContributions).toBeCloseTo(500 * 3, 6);
  });

  it('depreciates a vehicle monthly using its age-aware depreciation profile', () => {
    const vehicle = account({ id: 'v1', accountType: 'vehicle' });
    const details = makeDetails({
      purchaseDate: '2024-01-15', // 24 months old at projection start
      currentValue: 30000,
      vehicleDepreciationProfile: 'medium',
    });

    const { projectionRows } = call([vehicle], 30, 31, { details: { v1: details } });

    // Mirror of the engine loop: taper strength 0.55, first-year 16%, floor 6%
    let expected = 30000;
    for (let months = 24; months < 36; months++) {
      const annualDep = Math.min(16, Math.max(6, 6 + (16 - 6) * Math.pow(0.55, months / 12)));
      expected *= 1 - annualDep / 100 / 12;
    }
    expect(projectionRows[0]['account-0']).toBe(30000);
    expect(projectionRows[1]['account-0']).toBeCloseTo(expected, 2);
    // A depreciating asset never adds to contributions
    expect(projectionRows[1].totalContributions).toBe(0);
  });

  it('uses the real (inflation-adjusted) asset rate when enabled', () => {
    const home = account({ id: 'home1', accountType: 'home' });
    const details = makeDetails({
      currentValue: 450000,
      homeGrowthProfile: 'custom',
      annualChangeRate: 6,
    });

    const { projectionRows } = call([home], 30, 31, {
      details: { home1: details },
      inflationRatePercent: 2.5,
      useInflationAdjustedValues: true,
    });

    const realRate = ((1 + 6 / 100) / (1 + 2.5 / 100) - 1) * 100;
    const expected = 450000 * Math.pow(1 + realRate / 100 / 12, 12);
    expect(projectionRows[1]['account-0']).toBeCloseTo(expected, 2);
  });

  it('never withdraws from combined assets post-retirement; liquid accounts absorb the full withdrawal pro-rata', () => {
    const brokerage = account({ id: 'b1', startingBalance: 100000, annualRate: 0 });
    const home = account({ id: 'home1', accountType: 'home' });
    const details = makeDetails({
      currentValue: 50000,
      homeGrowthProfile: 'none',
    });

    const { projectionRows } = call([brokerage, home], 64, 65, {
      details: { home1: details },
      projectionEndAge: 66,
      annualWithdrawal: 12000,
    });

    // Home equity untouched; brokerage pays its share of each month's
    // withdrawal, with the share recomputed against current balances.
    let expectedBrokerage = 100000;
    for (let month = 0; month < 12; month++) {
      const share = expectedBrokerage / (expectedBrokerage + 50000);
      expectedBrokerage -= 1000 * share;
    }
    expect(projectionRows[2]['account-1']).toBe(50000);
    expect(projectionRows[2]['account-0']).toBeCloseTo(expectedBrokerage, 2);
    expect(projectionRows[2].totalBalance).toBeCloseTo(expectedBrokerage + 50000, 2);
  });
});

describe('getProjection — IRS limit edge cases', () => {
  it('uses the family HSA limit when the household has multiple people', () => {
    const spouse: PlannerPerson = { ...person, id: 'p2', name: 'Spouse' };
    const hsa = account({
      id: 'h1',
      accountType: 'hsa',
      contributionValue: 1000, // 12000/yr attempted
      startingBalance: 0,
      annualRate: 0,
    });

    const { projectionRows } = call([hsa], 30, 31, {
      people: [person, spouse],
      annualIrsLimitGrowthRate: 0,
    });

    // Family limit 8750 caps the 12000 attempt (no growth, owner under 55)
    expect(projectionRows[1]['account-0']).toBeCloseTo(8750, 6);
    expect(projectionRows[1].totalContributions).toBeCloseTo(8750, 6);
  });

  it('grows the IRS limit by the configured growth rate for later projection years', () => {
    const hsa = account({
      id: 'h1',
      accountType: 'hsa',
      contributionValue: 1000,
      startingBalance: 0,
      annualRate: 0,
    });

    const { projectionRows } = call([hsa], 30, 32, {
      annualIrsLimitGrowthRate: 10,
    });

    // Year 1: elapsed 0 years → limit ungrown (4400); Year 2 balance
    // accumulates: 4400 + (4400 * 1.1)
    expect(projectionRows[1]['account-0']).toBeCloseTo(4400, 6);
    expect(projectionRows[2]['account-0']).toBeCloseTo(4400 + 4400 * 1.1, 6);
  });

  it('falls back to people[0] as the account owner when personIds match nobody', () => {
    const orphan = account({
      id: 'x1',
      accountType: '401k',
      personIds: ['unknown'],
      contributionValue: 500,
      employerMatchRate: 100,
      employerMatchMaxPercentOfSalary: 5,
      startingBalance: 0,
      annualRate: 0,
    });

    const { projectionRows } = call([orphan], 30, 31);

    // Owner falls back to people[0] (salary 120000): 500/mo employee + 500/mo match
    expect(projectionRows[1]['account-0']).toBeCloseTo(12000, 6);
    expect(projectionRows[1].totalContributions).toBeCloseTo(12000, 6);
  });

  it('applies no income growth, match, or catch-up when the household is empty', () => {
    const orphan = account({
      id: 'x1',
      accountType: '401k',
      personIds: ['unknown'],
      contributionValue: 500,
      employerMatchRate: 100,
      employerMatchMaxPercentOfSalary: 5,
      startingBalance: 0,
      annualRate: 0,
    });

    const { projectionRows } = call([orphan], 30, 31, { people: [] });

    // No owner at all: contributions still flow, employer match is 0 (no salary)
    expect(projectionRows[1]['account-0']).toBeCloseTo(6000, 6);
    expect(projectionRows[1].totalContributions).toBeCloseTo(6000, 6);
  });
});

describe('market adjustment (stress test)', () => {
  const base = () => [
    account({
      id: 'inv',
      accountType: '401k',
      personIds: ['p1'],
      contributionValue: 0,
      startingBalance: 100000,
      annualRate: 7,
    }),
  ];

  it('lowers projected balances when returns are shifted down', () => {
    const good = call(base(), 40, 50, { annualReturnAdjustmentPercent: 0 });
    const bad = call(base(), 40, 50, { annualReturnAdjustmentPercent: -3 });

    const goodFinal = good.projectionRows[good.projectionRows.length - 1].totalBalance;
    const badFinal = bad.projectionRows[bad.projectionRows.length - 1].totalBalance;
    expect(badFinal).toBeLessThan(goodFinal);
    // 100k at 4% nominal, compounded monthly, for 10 years
    expect(badFinal).toBeCloseTo(100000 * (1 + 0.04 / 12) ** 120, -2);
  });

  it('leaves liability interest rates untouched — bad markets do not shrink debt', () => {
    const debt = [
      account({
        id: 'loan',
        accountType: 'mortgage',
        personIds: ['p1'],
        contributionValue: 0,
        startingBalance: -100000,
        annualRate: 5,
      }),
    ];
    const baseRun = call(debt, 40, 41);
    const stressed = call(debt, 40, 41, { annualReturnAdjustmentPercent: -3 });
    expect(stressed.projectionRows[1]['account-0']).toBeCloseTo(
      baseRun.projectionRows[1]['account-0'],
      6,
    );
  });
});
