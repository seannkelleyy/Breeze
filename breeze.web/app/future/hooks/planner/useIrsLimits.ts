'use client';
import { useQuery } from '@tanstack/react-query';

import useGraphql from '@/lib/services/useGraphql';
import { GET_CONTRIBUTION_LIMITS } from '@/lib/services/queries/planning';
import { defaultIrsLimits } from '../../lib/plannerMath';
import type { IrsLimitConfig, IrsLimitKey } from '../../types/irs';

const API_TYPE_TO_KEY: Record<string, IrsLimitKey> = {
  ACCOUNT_401K: '401k',
  ACCOUNT_403B: '403b',
  ACCOUNT_457: '457',
  ROTH_IRA: 'roth-ira',
  TRADITIONAL_IRA: 'traditional-ira',
  HSA: 'hsa',
};

interface ContributionLimitDto {
  accountType: string;
  taxYear: number;
  annualLimit: string;
  catchUpAge: number;
  catchUpAmount: string;
  superCatchUpAmount: string;
  familyAnnualLimit: string | null;
}

/**
 * IRS contribution limits for the current tax year, served from the seeded
 * `contribution_limits` table. Falls back to bundled constants while loading
 * or when the API has no rows for the year, so planner UIs always render.
 */
const useIrsLimits = () => {
  const { request } = useGraphql();
  const taxYear = new Date().getFullYear();

  const { data, isLoading, isError } = useQuery<IrsLimitConfig>({
    queryKey: ['contributionLimits', taxYear],
    staleTime: 24 * 60 * 60 * 1000,
    queryFn: async () => {
      const response = await request<
        { contributionLimits: ContributionLimitDto[] },
        { taxYear: number }
      >(GET_CONTRIBUTION_LIMITS, { taxYear });
      const rows = response.contributionLimits ?? [];
      if (rows.length === 0) return defaultIrsLimits;

      const limits: IrsLimitConfig = { ...defaultIrsLimits };
      for (const row of rows) {
        const key = API_TYPE_TO_KEY[row.accountType];
        if (!key) continue;
        limits[key] = {
          baseAnnualLimit: Number(row.annualLimit) || 0,
          catchUpAmount: Number(row.catchUpAmount) || 0,
          catchUpAge: row.catchUpAge,
          superCatchUpAmount: Number(row.superCatchUpAmount) || 0,
          ...(row.familyAnnualLimit ? { familyAnnualLimit: Number(row.familyAnnualLimit) } : {}),
        };
      }
      return limits;
    },
  });

  return {
    irsLimits: data ?? defaultIrsLimits,
    isIrsAccountsLoading: isLoading,
    isIrsAccountsError: isError,
  };
};

export default useIrsLimits;
