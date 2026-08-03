'use client';
import { useQuery } from '@tanstack/react-query';
import { ESTIMATE_TAXES_FOR_YEAR } from '../queries/taxPlanning';
import useGraphql from '../useGraphql';

export interface TaxEstimate {
  taxOwed: string;
  taxableIncome: string;
  effectiveRate: string;
  marginalRate: string;
}

export interface CalculateTaxEstimateInput {
  year: number;
  filingStatus: string;
  income: string;
  deduction?: string;
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
      return request<TaxEstimate>(
        ESTIMATE_TAXES_FOR_YEAR,
        input as unknown as Record<string, unknown>,
      );
    },
    enabled: enabled && !!input,
  });

  return { data, isPending, error };
};
