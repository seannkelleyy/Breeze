'use client';
import { useQuery } from '@tanstack/react-query'
import { CALCULATE_RETIREMENT_LADDER } from '../queries/retirementLadder'
import useGraphql from '../useGraphql'

export interface LadderStep {
  year: number;
  age: number;
  withdrawalAmount: string;
  taxableWithdrawal: string;
  estimatedIncomeTax: string;
  earlyWithdrawalPenalty: string;
  netWithdrawal: string;
  remainingBalance: string;
  isAccessible: boolean;
}

export interface RetirementLadderProjection {
  initialBalance: string;
  annualExpenses: string;
  currentAge: number;
  firstWithdrawalAge: number;
  isRoth: boolean;
  projectedSteps: LadderStep[];
  isSustainable: boolean;
  projectedDepletionAge: number | null;
}

interface CalculateRetirementLadderInput {
  initialBalance: string;
  annualExpenses: string;
  currentAge: number;
  firstWithdrawalAge: number;
  isRoth: boolean;
  year: number;
  filingStatus: string;
  yearsToProject?: number;
}

export const useRetirementLadder = (
  input: CalculateRetirementLadderInput | null,
  enabled: boolean = false,
) => {
  const { request } = useGraphql();

  const { data, isPending, error } = useQuery<RetirementLadderProjection | null>({
    queryKey: ['retirementLadder', input],
    queryFn: async () => {
      if (!input) return null;
      return request<RetirementLadderProjection>(CALCULATE_RETIREMENT_LADDER, input as unknown as Record<string, unknown>);
    },
    enabled: enabled && !!input,
  });

  return { data, isPending, error };
};
