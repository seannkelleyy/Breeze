import { useMemo } from 'react';

import * as plannerConfig from '../../../lib/config';
import {
  clamp,
  getPlannerContributionTotals,
  getTotalMonthlyForAccount,
} from '../../../lib/plannerMath';
import { getEffectiveAnnualRatePercent, getRealAnnualRatePercent } from '../../../lib/rates';
import { getAssetFinanceSnapshot, getNetWorthStartingBalance } from '../../../lib/projection';
import type { AssetFinanceDetails } from '../../../types/finance';
import type { PlannerAccount } from '../../../types/account';
import type { Household, Portfolio } from './types';

const { isCombinedAssetType, isLiabilityAccountType } = plannerConfig;

export function usePortfolioCalculation(
  accounts: PlannerAccount[],
  assetFinanceDetailsByAccountId: Record<string, AssetFinanceDetails>,
  household: Household,
  inflationRate: number,
  useInflationAdjustedValues: boolean,
): Portfolio {
  const totalStartingBalance = useMemo(
    () =>
      accounts.reduce((sum, account) => {
        if (isCombinedAssetType(account.accountType)) {
          const details = assetFinanceDetailsByAccountId[account.id];
          if (details) return sum + getAssetFinanceSnapshot(details, new Date()).equity;
        }
        return sum + getNetWorthStartingBalance(account);
      }, 0),
    [accounts, assetFinanceDetailsByAccountId],
  );

  // Investment assets only (excludes home/vehicle equity and liabilities) — used for FIRE targets
  const investmentStartingBalance = useMemo(
    () =>
      accounts
        .filter(
          (a) => !isCombinedAssetType(a.accountType) && !isLiabilityAccountType(a.accountType),
        )
        .reduce((sum, a) => sum + clamp(a.startingBalance), 0),
    [accounts],
  );

  const totalAssets = useMemo(
    () =>
      accounts
        .filter((a) => !isLiabilityAccountType(a.accountType))
        .reduce((sum, a) => {
          if (isCombinedAssetType(a.accountType))
            return (
              sum + clamp(assetFinanceDetailsByAccountId[a.id]?.currentValue ?? a.startingBalance)
            );
          return sum + clamp(a.startingBalance);
        }, 0),
    [accounts, assetFinanceDetailsByAccountId],
  );

  const totalLiabilities = useMemo(
    () =>
      accounts.reduce((sum, a) => {
        if (isLiabilityAccountType(a.accountType)) return sum + clamp(a.startingBalance);
        if (isCombinedAssetType(a.accountType)) {
          const d = assetFinanceDetailsByAccountId[a.id];
          if (d?.hasLoan) return sum + clamp(d.currentLoanBalance);
        }
        return sum;
      }, 0),
    [accounts, assetFinanceDetailsByAccountId],
  );

  const { totalPlannedMonthlyEmployee, totalPlannedMonthlyInvestment } = useMemo(
    () => getPlannerContributionTotals(accounts, household.people),
    [accounts, household.people],
  );

  const weightedAnnualRate = useMemo(() => {
    const totalWeight = accounts.reduce(
      (s, a) => s + getTotalMonthlyForAccount(a, household.people),
      0,
    );
    if (totalWeight === 0)
      return accounts.length > 0
        ? accounts.reduce((s, a) => s + a.annualRate, 0) / accounts.length
        : 0;
    return accounts.reduce(
      (s, a) => s + (getTotalMonthlyForAccount(a, household.people) / totalWeight) * a.annualRate,
      0,
    );
  }, [accounts, household.people]);

  const effectiveWeightedAnnualRate = useMemo(
    () =>
      getEffectiveAnnualRatePercent(weightedAnnualRate, inflationRate, useInflationAdjustedValues),
    [weightedAnnualRate, inflationRate, useInflationAdjustedValues],
  );

  const emergencyFundBalance = useMemo(
    () =>
      accounts
        .filter((a) => a.accountType === 'emergency-fund' || a.accountType === 'checking')
        .reduce((sum, a) => sum + getNetWorthStartingBalance(a), 0),
    [accounts],
  );

  const currentSavingsRateEmployee =
    household.annualHouseholdIncome > 0
      ? (totalPlannedMonthlyEmployee * 12 * 100) / household.annualHouseholdIncome
      : 0;
  const currentSavingsRateTotal =
    household.annualHouseholdIncome > 0
      ? (totalPlannedMonthlyInvestment * 12 * 100) / household.annualHouseholdIncome
      : 0;

  const realWeightedAnnualRate = useMemo(
    () => getRealAnnualRatePercent(weightedAnnualRate, inflationRate),
    [weightedAnnualRate, inflationRate],
  );

  return {
    totalStartingBalance,
    investmentStartingBalance,
    totalAssets,
    totalLiabilities,
    totalPlannedMonthlyEmployee,
    totalPlannedMonthlyInvestment,
    weightedAnnualRate,
    effectiveWeightedAnnualRate,
    realWeightedAnnualRate,
    currentSavingsRateEmployee,
    currentSavingsRateTotal,
    emergencyFundBalance,
  };
}
