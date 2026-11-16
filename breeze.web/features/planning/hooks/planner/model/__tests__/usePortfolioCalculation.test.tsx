import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';

import type { PlannerAccount } from '@/features/planning/types/account';
import type { PlannerPerson } from '@/features/planning/types/person';
import type { AssetFinanceDetails } from '@/features/planning/types/finance';
import { usePortfolioCalculation } from '../usePortfolioCalculation';
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
  id: 'brokerage1',
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

const homeDetails = (overrides: Partial<AssetFinanceDetails> = {}): AssetFinanceDetails => ({
  purchaseDate: '2020-01-01',
  purchasePrice: 500_000,
  currentValue: 600_000,
  annualChangeRate: 4,
  homeGrowthProfile: 'medium',
  vehicleDepreciationProfile: 'custom',
  hasLoan: true,
  loanInterestRate: 5,
  originalLoanAmount: 450_000,
  loanMonthlyPayment: 2_000,
  loanTermYears: 30,
  loanStartDate: '2020-01-01',
  currentLoanBalance: 180_000,
  ...overrides,
});

const scenarios = () => ({
  accounts: [
    account(),
    account({ id: 'checking1', name: 'Checking', accountType: 'checking', startingBalance: 20_000, annualRate: 0, contributionValue: 0 }),
    account({
      id: 'home1',
      name: 'Home',
      accountType: 'home',
      startingBalance: 500_000,
      annualRate: 4,
      contributionValue: 0,
    }),
    account({
      id: 'mort1',
      name: 'Mortgage',
      accountType: 'mortgage',
      startingBalance: 200_000,
      annualRate: 5,
      contributionValue: 2_000,
      personIds: [],
    }),
  ],
  assetFinanceDetailsByAccountId: { home1: homeDetails() },
  household: household(),
});

describe('usePortfolioCalculation', () => {
  it('combines balances, equity, and liabilities into the portfolio snapshot', () => {
    const { accounts, assetFinanceDetailsByAccountId, household: h } = scenarios();

    const { result } = renderHook(() =>
      usePortfolioCalculation(accounts, assetFinanceDetailsByAccountId, h, 3, false),
    );

    // Home counts at its current value; the linked loan counts as a liability.
    expect(result.current.totalAssets).toBe(720_000);
    expect(result.current.totalLiabilities).toBe(380_000);
    // Net worth: brokerage + checking + home equity (600k - 180k) - mortgage.
    expect(result.current.totalStartingBalance).toBe(340_000);
    // Investable assets only (brokerage + checking).
    expect(result.current.investmentStartingBalance).toBe(120_000);
    expect(result.current.emergencyFundBalance).toBe(20_000);
  });

  it('weights the annual rate by each account contribution', () => {
    const { accounts, assetFinanceDetailsByAccountId, household: h } = scenarios();

    const { result } = renderHook(() =>
      usePortfolioCalculation(accounts, assetFinanceDetailsByAccountId, h, 3, false),
    );

    // Weight: brokerage $1k/mo at 7%, mortgage $2k/mo at 5% → 5.667%.
    expect(result.current.weightedAnnualRate).toBeCloseTo(5.6667, 3);
    expect(result.current.effectiveWeightedAnnualRate).toBeCloseTo(5.6667, 3);
    expect(result.current.realWeightedAnnualRate).toBeCloseTo(
      ((1 + result.current.weightedAnnualRate / 100) / 1.03 - 1) * 100,
      6,
    );
  });

  it('reports real rates when inflation-adjusted values are on', () => {
    const { accounts, assetFinanceDetailsByAccountId, household: h } = scenarios();

    const { result } = renderHook(() =>
      usePortfolioCalculation(accounts, assetFinanceDetailsByAccountId, h, 3, true),
    );

    expect(result.current.effectiveWeightedAnnualRate).toBeCloseTo(
      result.current.realWeightedAnnualRate,
      6,
    );
  });

  it('credits liability principal paydown to planned investments', () => {
    const { accounts, assetFinanceDetailsByAccountId, household: h } = scenarios();

    const { result } = renderHook(() =>
      usePortfolioCalculation(accounts, assetFinanceDetailsByAccountId, h, 3, false),
    );

    // Mortgage: $2,000 payment - $833.33 interest = $1,166.67 principal.
    expect(result.current.totalPlannedMonthlyEmployee).toBe(1_000);
    expect(result.current.totalPlannedMonthlyInvestment).toBeCloseTo(2_166.67, 2);
    expect(result.current.currentSavingsRateEmployee).toBeCloseTo(12, 6);
    expect(result.current.currentSavingsRateTotal).toBeCloseTo(26, 4);
  });

  it('adds linked-debt principal that is excluded from the account list', () => {
    const { accounts, assetFinanceDetailsByAccountId, household: h } = scenarios();

    const { result } = renderHook(() =>
      usePortfolioCalculation(accounts, assetFinanceDetailsByAccountId, h, 3, false, 500),
    );

    expect(result.current.totalPlannedMonthlyInvestment).toBeCloseTo(2_666.67, 2);
  });

  it('falls back to the average rate when no account has contributions', () => {
    const accounts = [
      account({ id: 'a1', contributionValue: 0, annualRate: 4, startingBalance: 10_000 }),
      account({ id: 'a2', contributionValue: 0, annualRate: 6, startingBalance: 10_000 }),
    ];

    const { result } = renderHook(() =>
      usePortfolioCalculation(accounts, {}, household(), 3, false),
    );

    expect(result.current.weightedAnnualRate).toBeCloseTo(5, 6);
  });

  it('returns zero rates and balances for an empty portfolio', () => {
    const { result } = renderHook(() =>
      usePortfolioCalculation([], {}, household({ annualHouseholdIncome: 0 }), 3, false),
    );

    expect(result.current).toMatchObject({
      totalStartingBalance: 0,
      investmentStartingBalance: 0,
      totalAssets: 0,
      totalLiabilities: 0,
      totalPlannedMonthlyEmployee: 0,
      totalPlannedMonthlyInvestment: 0,
      weightedAnnualRate: 0,
      currentSavingsRateEmployee: 0,
      currentSavingsRateTotal: 0,
      emergencyFundBalance: 0,
    });
  });
});
