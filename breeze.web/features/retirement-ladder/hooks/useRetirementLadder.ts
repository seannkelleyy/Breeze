'use client';
import { useQuery } from '@tanstack/react-query';
import { CALCULATE_RETIREMENT_LADDER } from '../retirementLadder.operations';
import useGraphql from '../../../lib/services/useGraphql';
import type { CalculateRetirementLadderQuery, FilingStatus } from '@/lib/gql/graphql';

/** Response shape derived from the generated document. */
export type RetirementLadderProjection =
  CalculateRetirementLadderQuery['calculateRetirementLadder'];

export interface CalculateRetirementLadderInput {
  initialBalance: string;
  annualExpenses: string;
  currentAge: number;
  firstWithdrawalAge: number;
  isRoth: boolean;
  year: number;
  filingStatus: FilingStatus;
  yearsToProject?: number;
}

export const useRetirementLadder = (
  input: CalculateRetirementLadderInput | null,
  enabled: boolean = false,
) => {
  const { request } = useGraphql();

  const { data, isPending, error } = useQuery({
    queryKey: ['retirementLadder', input],
    queryFn: async () => {
      if (!input) return null;
      const response = await request(CALCULATE_RETIREMENT_LADDER, input);
      return response.calculateRetirementLadder;
    },
    enabled: enabled && !!input,
  });

  return { data, isPending, error };
};
