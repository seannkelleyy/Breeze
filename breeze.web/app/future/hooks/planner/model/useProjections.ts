import { useMemo } from 'react';

import { getProjection, getPortfolioAverageGrowthRate } from '../../../lib/projection';
import type { AssetFinanceDetails } from '../../../types/finance';
import type { IrsLimitConfig } from '../../../types/irs';
import type { PlannerAccount } from '../../../types/account';
import type { Household } from './types';

export function useProjections(
  accounts: PlannerAccount[],
  household: Household,
  assetFinanceDetailsByAccountId: Record<string, AssetFinanceDetails>,
  irsLimits: IrsLimitConfig,
  inflationRate: number,
  useInflationAdjustedValues: boolean,
  projectionEndAge?: number,
  annualWithdrawal?: number,
  annualReturnAdjustmentPercent = 0,
) {
  const { projectionRows } = useMemo(
    () =>
      getProjection(
        accounts,
        household.currentAge,
        household.targetAge,
        household.people,
        assetFinanceDetailsByAccountId,
        irsLimits,
        // IRS limits are statutory nominal dollars — grow them at the user's
        // inflation assumption instead of a hardcoded rate.
        inflationRate,
        inflationRate,
        useInflationAdjustedValues,
        projectionEndAge,
        annualWithdrawal,
        annualReturnAdjustmentPercent,
      ),
    [
      accounts,
      household.currentAge,
      household.targetAge,
      household.people,
      assetFinanceDetailsByAccountId,
      irsLimits,
      inflationRate,
      useInflationAdjustedValues,
      projectionEndAge,
      annualWithdrawal,
      annualReturnAdjustmentPercent,
    ],
  );

  const portfolioAverageRate = getPortfolioAverageGrowthRate(
    accounts,
    assetFinanceDetailsByAccountId,
    inflationRate,
    useInflationAdjustedValues,
    annualReturnAdjustmentPercent,
  );

  // Stats described as "at target age" must read the target-age row — not the
  // final row — so extending the chart past retirement doesn't change them.
  const targetRow =
    projectionRows.find((row) => row.age === household.targetAge) ??
    projectionRows[projectionRows.length - 1];
  const projectedNetWorthAtTargetAge = targetRow?.totalBalance ?? 0;
  const targetAgeBalances = accounts.map(
    (_, index) => (targetRow?.[`account-${index}`] as number | undefined) ?? 0,
  );

  return { projectionRows, finalBalances: targetAgeBalances, projectedNetWorthAtTargetAge, portfolioAverageRate };
}
