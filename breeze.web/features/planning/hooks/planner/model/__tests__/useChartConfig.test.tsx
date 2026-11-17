import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';

import type { PlannerAccount } from '@/features/planning/types/account';
import { useChartConfig } from '../useChartConfig';
import { useFinancialMathSnapshot } from '../useFinancialMathSnapshot';
import type { Household, Portfolio } from '../types';

const account = (overrides: Partial<PlannerAccount> = {}): PlannerAccount => ({
  id: 'a1',
  name: 'Brokerage',
  personIds: [],
  accountType: 'brokerage',
  contributionMode: 'monthly',
  contributionValue: 0,
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

const household: Household = {
  people: [],
  currentAge: 40,
  targetAge: 65,
  yearsToGoal: 25,
  annualHouseholdIncome: 100_000,
};

const portfolio: Portfolio = {
  totalStartingBalance: 250_000,
  investmentStartingBalance: 200_000,
  totalAssets: 300_000,
  totalLiabilities: 50_000,
  totalPlannedMonthlyEmployee: 1_000,
  totalPlannedMonthlyInvestment: 1_500,
  weightedAnnualRate: 6,
  effectiveWeightedAnnualRate: 6,
  realWeightedAnnualRate: 3.4,
  currentSavingsRateEmployee: 12,
  currentSavingsRateTotal: 18,
  emergencyFundBalance: 25_000,
};

describe('useChartConfig', () => {
  it('maps each account to a labelled, colour-coded series', () => {
    const accounts = [
      account({ id: 'a1', name: 'Brokerage' }),
      account({ id: 'a2', name: 'Roth IRA' }),
    ];

    const { result } = renderHook(() => useChartConfig(accounts));

    const config = result.current as Record<string, { label?: string; color?: string }>;

    expect(config['account-0']).toMatchObject({ label: 'Brokerage' });
    expect(config['account-1']).toMatchObject({ label: 'Roth IRA' });
    expect(config['account-0'].color).not.toBe(config['account-1'].color);
    // Shared series (e.g. total balance) survive alongside the accounts.
    expect(config.totalBalance).toBeDefined();
  });

  it('returns only the shared series with no accounts', () => {
    const { result } = renderHook(() => useChartConfig([]));
    const config = result.current as Record<string, unknown>;

    expect(config.totalBalance).toBeDefined();
    expect(config['account-0']).toBeUndefined();
  });
});

describe('useFinancialMathSnapshot', () => {
  it('derives spending, withdrawal, and savings figures from the inputs', () => {
    const { result } = renderHook(() =>
      useFinancialMathSnapshot(
        5_000,
        household,
        4,
        portfolio,
        null,
        'STANDARD',
        [],
        [],
        [],
        'SINGLE',
      ),
    );

    expect(result.current.monthlyExpenses).toBe(5_000);
    expect(result.current.annualSpend).toBe(60_000);
    expect(result.current.emergencyFundBalance).toBe(25_000);
    expect(result.current.emergencyFund3Months).toBe(15_000);
    expect(result.current.emergencyFund12Months).toBe(60_000);
    expect(result.current.selfSalary).toBe(100_000);
    expect(result.current.grossIncome).toBe(100_000);
    expect(result.current.safeWithdrawalRatePercent).toBe(4);
    expect(result.current.withdrawalMultiplier).toBe(25);
    expect(result.current.currentPortfolio).toBe(250_000);
    expect(result.current.yearlyPortfolioIncome).toBe(10_000);
    // The household waterfall is always attached (empty when no people).
    expect(result.current.payroll).toBeDefined();
  });

  it('falls back to a 25x multiplier when the withdrawal rate is zero', () => {
    const { result } = renderHook(() =>
      useFinancialMathSnapshot(0, household, 0, portfolio, null, 'STANDARD', [], [], [], 'SINGLE'),
    );

    expect(result.current.withdrawalMultiplier).toBe(25);
    expect(result.current.yearlyPortfolioIncome).toBe(0);
    expect(result.current.annualSpend).toBe(0);
  });
});
