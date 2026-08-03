import { useCallback } from 'react';

import { useQuery } from '@tanstack/react-query';
import { Income } from '../../types/income';
import { useIncomes } from './index';

interface FetchIncomesProps {
  budgetId: string;
  enabled?: boolean;
}

/**
 * A hook for fetching income data.
 * @param budgetId. The Id of the budget to fetch incomes for.
 * @param enabled. - optional - Determines whether or not the request is made.
 */
const useFetchIncomes = ({ budgetId, enabled }: FetchIncomesProps) => {
  const { getIncomes } = useIncomes();

  const fetchIncome = useCallback(() => {
    if (!enabled) {
      return [];
    }
    return getIncomes(budgetId);
  }, [getIncomes, budgetId, enabled]);

  return useQuery<Income[], Error>({
    queryKey: ['income', budgetId],
    queryFn: fetchIncome,
    refetchInterval: 180 * 1000,
    retryDelay: 1 * 1000,
    retry: 3,
    enabled: enabled,
  });
};

export default useFetchIncomes;
