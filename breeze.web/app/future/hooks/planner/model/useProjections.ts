import { useMemo } from 'react';

import * as plannerConstants from '../../../lib/constants';
import { getProjection } from '../../../lib/projection';
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
) {
  const { projectionRows, finalBalances } = useMemo(
    () =>
      getProjection(
        accounts,
        household.currentAge,
        household.targetAge,
        household.people,
        assetFinanceDetailsByAccountId,
        irsLimits,
        plannerConstants.PLANNER_DEFAULT_IRS_LIMIT_GROWTH_RATE,
        inflationRate,
        useInflationAdjustedValues,
        projectionEndAge,
        annualWithdrawal,
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
    ],
  );

  const projectedNetWorthAtTargetAge = projectionRows[projectionRows.length - 1]?.totalBalance ?? 0;

  return { projectionRows, finalBalances, projectedNetWorthAtTargetAge };
}
