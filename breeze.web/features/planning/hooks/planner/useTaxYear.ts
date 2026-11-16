'use client';

import { useQuery } from '@tanstack/react-query';

import useGraphql from '@/lib/services/useGraphql';
import { GET_TAX_YEAR_DATA } from '@/features/taxes/tax.operations';
import type { TaxYearTables } from '../../../../features/planning/types/tax';
import type { FilingStatus } from '@/lib/gql/graphql';

/**
 * Fetches the tax tables (brackets, standard deduction, SS wage base) for the
 * latest seeded tax year, pre-filtered to the given filing status.
 * Returns null while loading — the data is static reference data, so it is
 * fetched once and cached for the session.
 */
function useTaxYear(filingStatus: FilingStatus): TaxYearTables | null {
  const { request } = useGraphql();

  const { data } = useQuery({
    queryKey: ['taxYearData', filingStatus],
    queryFn: async (): Promise<TaxYearTables | null> => {
      const response = await request(GET_TAX_YEAR_DATA, { filingStatus });

      const taxYearData = response.taxYearData;
      if (!taxYearData) return null;

      return {
        year: taxYearData.year,
        brackets: taxYearData.brackets.map((b) => ({
          minimum: Number(b.minimumAmount),
          maximum: b.maximumAmount == null ? null : Number(b.maximumAmount),
          rate: Number(b.rate),
        })),
        standardDeduction: Number(taxYearData.standardDeduction),
        ssWageBase: Number(taxYearData.ssWageBase),
      };
    },
    staleTime: Infinity,
  });

  return data ?? null;
}

export default useTaxYear;
