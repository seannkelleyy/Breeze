'use client';
import { useQuery } from '@tanstack/react-query'
import { CALCULATE_TAX_ESTIMATE } from '../queries/taxPlanning'
import useGraphql from '../useGraphql'

export interface TaxEstimate {
  taxOwed: string;
  taxableIncome: string;
  effectiveRate: string;
  marginalRate: string;
}

interface CalculateTaxEstimateInput {
  year: number;
  filingStatus: string;
  income: string;
  deductionAmount?: string;
}

export const useTaxEstimate = (
  input: CalculateTaxEstimateInput | null,
  enabled: boolean = false,
) => {
  const { request } = useGraphql();

  const { data, isPending, error } = useQuery<TaxEstimate | null>({
    queryKey: ['taxEstimate', input],
    queryFn: async () => {
      if (!input) return null;
      return request<TaxEstimate>(CALCULATE_TAX_ESTIMATE, input as unknown as Record<string, unknown>);
    },
    enabled: enabled && !!input,
  });

  return { data, isPending, error };
};
