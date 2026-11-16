'use client';
import { useQuery } from '@tanstack/react-query';
import { ESTIMATE_TAXES_FOR_YEAR } from '../taxPlanning.operations';
import useGraphql from '../../../lib/services/useGraphql';
import type { EstimateTaxesForYearQuery, FilingStatus } from '@/lib/gql/graphql';

/** Response shape derived from the generated document. */
export type TaxEstimate = EstimateTaxesForYearQuery['estimateTaxesForYear'];

export interface CalculateTaxEstimateInput {
  year: number;
  filingStatus: FilingStatus;
  income: string;
  deduction?: string | null;
}

export const useTaxEstimate = (
  input: CalculateTaxEstimateInput | null,
  enabled: boolean = false,
) => {
  const { request } = useGraphql();

  const { data, isPending, error } = useQuery({
    queryKey: ['taxEstimate', input],
    queryFn: async () => {
      if (!input) return null;
      const response = await request(ESTIMATE_TAXES_FOR_YEAR, input);
      return response.estimateTaxesForYear;
    },
    enabled: enabled && !!input,
  });

  return { data, isPending, error };
};
