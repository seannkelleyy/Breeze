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
  /** Principal paydown of liabilities excluded from `accounts` (linked loans).
   * Their payments build equity, so they count toward the savings rate. */
  linkedDebtPrincipalMonthly = 0,
): Portfolio {
  const totalStartingBalance = accounts.reduce((sum, account) => {
    if (isCombinedAssetType(account.accountType)) {
      const details = assetFinanceDetailsByAccountId[account.id];
      if (details) return sum + getAssetFinanceSnapshot(details, new Date()).equity;
    }
    return sum + getNetWorthStartingBalance(account);
  }, 0);

  // Investment assets only (excludes home/vehicle equity and liabilities) — used for FIRE targets
  const investmentStartingBalance = accounts
    .filter((a) => !isCombinedAssetType(a.accountType) && !isLiabilityAccountType(a.accountType))
    .reduce((sum, a) => sum + clamp(a.startingBalance), 0);

  const totalAssets = accounts
    .filter((a) => !isLiabilityAccountType(a.accountType))
    .reduce((sum, a) => {
      if (isCombinedAssetType(a.accountType))
        return sum + clamp(assetFinanceDetailsByAccountId[a.id]?.currentValue ?? a.startingBalance);
      return sum + clamp(a.startingBalance);
    }, 0);

  const totalLiabilities = accounts.reduce((sum, a) => {
    if (isLiabilityAccountType(a.accountType)) return sum + clamp(a.startingBalance);
    if (isCombinedAssetType(a.accountType)) {
      const d = assetFinanceDetailsByAccountId[a.id];
      if (d?.hasLoan) return sum + clamp(d.currentLoanBalance);
    }
    return sum;
  }, 0);

  const { totalPlannedMonthlyEmployee, totalPlannedMonthlyInvestment: investedFromAccounts } =
    getPlannerContributionTotals(accounts, household.people);
  // Linked liabilities are excluded from `accounts` (their balance already
  // lives in the parent asset's equity) — add their principal back in so the
  // savings rate credits the paydown.
  const totalPlannedMonthlyInvestment = investedFromAccounts + linkedDebtPrincipalMonthly;

  const totalWeight = accounts.reduce(
    (s, a) => s + getTotalMonthlyForAccount(a, household.people),
    0,
  );
  const weightedAnnualRate =
    totalWeight === 0
      ? accounts.length > 0
        ? accounts.reduce((s, a) => s + a.annualRate, 0) / accounts.length
        : 0
      : accounts.reduce(
          (s, a) =>
            s + (getTotalMonthlyForAccount(a, household.people) / totalWeight) * a.annualRate,
          0,
        );

  const effectiveWeightedAnnualRate = getEffectiveAnnualRatePercent(
    weightedAnnualRate,
    inflationRate,
    useInflationAdjustedValues,
  );

  const emergencyFundBalance = accounts
    .filter((a) => a.accountType === 'emergency-fund' || a.accountType === 'checking')
    .reduce((sum, a) => sum + getNetWorthStartingBalance(a), 0);

  const currentSavingsRateEmployee =
    household.annualHouseholdIncome > 0
      ? (totalPlannedMonthlyEmployee * 12 * 100) / household.annualHouseholdIncome
      : 0;
  const currentSavingsRateTotal =
    household.annualHouseholdIncome > 0
      ? (totalPlannedMonthlyInvestment * 12 * 100) / household.annualHouseholdIncome
      : 0;

  const realWeightedAnnualRate = getRealAnnualRatePercent(weightedAnnualRate, inflationRate);

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
