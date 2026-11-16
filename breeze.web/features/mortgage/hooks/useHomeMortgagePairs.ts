'use client';
import { useQuery } from '@tanstack/react-query';

import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import useGraphql from '@/lib/services/useGraphql';
import { GET_ASSETS_BY_USER, GET_LIABILITIES_BY_USER } from '@/features/assets/asset.operations';
import { PLANNER_HOME_GROWTH_PROFILE_RATES } from '@/features/planning/lib/constants';
import { calculateRemainingMonths } from '@/features/mortgage/lib/amortization';

export interface HomeMortgagePair {
  id: string;
  label: string;
  mortgageBalance: number;
  originalLoanAmount: number;
  interestRate: number;
  monthlyPayment: number;
  remainingMonths: number;
  homeValue: number;
  homeAnnualGrowthRate: number;
}

const resolveGrowthRate = (profile: string | null): number => {
  if (profile && profile in PLANNER_HOME_GROWTH_PROFILE_RATES) {
    return PLANNER_HOME_GROWTH_PROFILE_RATES[
      profile as keyof typeof PLANNER_HOME_GROWTH_PROFILE_RATES
    ];
  }
  return PLANNER_HOME_GROWTH_PROFILE_RATES.medium;
};

/**
 * Pairs each HOME asset with its linked MORTGAGE liability and derives the
 * payoff months and growth profile the mortgage tools start from.
 */
export const useHomeMortgagePairs = () => {
  const { userId } = useCurrentUser();
  const { request } = useGraphql();

  return useQuery({
    queryKey: ['mortgage-pairs', userId],
    queryFn: async () => {
      const [assetsResp, liabilitiesResp] = await Promise.all([
        request(GET_ASSETS_BY_USER, { userId }),
        request(GET_LIABILITIES_BY_USER, { userId }),
      ]);

      const assets = (assetsResp?.assets ?? []).filter((a) => a.assetType === 'HOME');
      const liabilities = liabilitiesResp?.liabilities ?? [];
      const liabilityById = new Map(liabilities.map((l) => [l.id, l]));

      const result: HomeMortgagePair[] = [];
      for (const asset of assets) {
        if (!asset.linkedLiabilityId) continue;
        const liability = liabilityById.get(asset.linkedLiabilityId);
        if (!liability || liability.liabilityType !== 'MORTGAGE') continue;

        const balance = Number(liability.currentBalance) || 0;
        const rate = Number(liability.interestRate) * 100 || 0;
        const payment = Number(liability.minimumPayment) || 0;
        const original = Number(liability.originalLoanAmount) || 0;
        const homeVal = Number(asset.currentValue) || 0;

        result.push({
          id: asset.id,
          label: asset.name,
          mortgageBalance: balance,
          originalLoanAmount: original,
          interestRate: rate,
          monthlyPayment: payment,
          remainingMonths: calculateRemainingMonths(balance, rate, payment),
          homeValue: homeVal,
          homeAnnualGrowthRate: resolveGrowthRate(asset.homeGrowthProfile),
        });
      }

      return result;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
};
