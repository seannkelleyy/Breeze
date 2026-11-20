'use client';
import { useQuery } from '@tanstack/react-query';

import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import useGraphql from '@/lib/services/useGraphql';
import { GET_ASSETS_BY_USER, GET_LIABILITIES_BY_USER } from '@/features/assets/asset.operations';
import useGoalsApi from '@/features/goals/hooks/useGoalsApi';
import type { Goal } from '@/features/goals/types';

export interface DashboardSummary {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  assets: Array<{ name: string; value: number }>;
  liabilities: Array<{ name: string; value: number }>;
  assetCount: number;
  liabilityCount: number;
  assetsByType: Record<string, number>;
  liabilitiesByType: Record<string, number>;
  footSteps: Goal[];
  completedSteps: number;
  totalSteps: number;
  regularGoals: Goal[];
  completedGoals: number;
  totalGoals: number;
}

/** Sums money values into per-type buckets for the expandable dashboard cards. */
const sumByType = (items: Array<{ type: string; value: number }>): Record<string, number> => {
  const totals = new Map<string, number>();
  for (const { type, value } of items) {
    totals.set(type, (totals.get(type) ?? 0) + value);
  }
  return Object.fromEntries(totals);
};

/**
 * Net worth, asset/liability breakdowns, and goals progress for the dashboard.
 * Route-local: the dashboard is the only consumer.
 */
export function useDashboardSummary() {
  const { userId } = useCurrentUser();
  const { request } = useGraphql();
  const { getGoals } = useGoalsApi();

  return useQuery({
    queryKey: ['dashboard-summary', userId],
    queryFn: async (): Promise<DashboardSummary> => {
      const [assetsResp, liabilitiesResp, goalsResp] = await Promise.all([
        request(GET_ASSETS_BY_USER),
        request(GET_LIABILITIES_BY_USER),
        getGoals(),
      ]);

      const assets = assetsResp?.assets ?? [];
      const liabilities = liabilitiesResp?.liabilities ?? [];
      const goals = goalsResp ?? [];

      const assetValues = assets.map((a) => ({
        name: a.name,
        value: Number(a.currentValue) || 0,
      }));
      const liabilityValues = liabilities.map((l) => ({
        name: l.name,
        value: Number(l.currentBalance) || 0,
      }));

      const totalAssets = assetValues.reduce((sum, a) => sum + a.value, 0);
      const totalLiabilities = liabilityValues.reduce((sum, l) => sum + l.value, 0);

      const footSteps = goals
        .filter((g) => g.isFinancialOrderStep)
        .sort((a, b) => (a.financialOrderStep ?? 0) - (b.financialOrderStep ?? 0));
      const completedSteps = footSteps.filter((g) => g.isCompleted).length;

      const regularGoals = goals.filter((g) => !g.isFinancialOrderStep);
      const completedGoals = regularGoals.filter((g) => g.isCompleted).length;

      return {
        totalAssets,
        totalLiabilities,
        netWorth: totalAssets - totalLiabilities,
        assets: assetValues,
        liabilities: liabilityValues,
        assetCount: assets.length,
        liabilityCount: liabilities.length,
        assetsByType: sumByType(
          assets.map((a) => ({ type: a.assetType, value: Number(a.currentValue) || 0 })),
        ),
        liabilitiesByType: sumByType(
          liabilities.map((l) => ({ type: l.liabilityType, value: Number(l.currentBalance) || 0 })),
        ),
        footSteps,
        completedSteps,
        totalSteps: footSteps.length,
        regularGoals,
        completedGoals,
        totalGoals: regularGoals.length,
      };
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}
