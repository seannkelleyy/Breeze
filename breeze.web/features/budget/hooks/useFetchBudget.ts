import { useQuery } from '@tanstack/react-query';

import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import { Dayjs } from 'dayjs';
import { Budget } from '../types';
import { useBudgets } from './index';
import { useRegenerateBudget } from './useRegenerateBudget';

type FetchBudgetProps = {
  date: Dayjs;
};

/**
 * A hook for fetching budget data.
 * @param year. The year of the budget.
 * @param month. The month of the budget.
 */
export const useFetchBudget = ({ date }: FetchBudgetProps) => {
  const { userId } = useCurrentUser();
  const { getBudget } = useBudgets();
  const { regenerateBudgetMonth } = useRegenerateBudget();

  const fetchBudget = () => {
    return getBudget(date.year(), date.month() + 1);
  };

  return useQuery<Budget | null, Error>({
    queryKey: ['budget', userId, date.format('YYYY-MM')],
    refetchInterval: 180 * 1000,
    retryDelay: 1 * 1000,
    retry: 3,
    enabled: Boolean(userId),
    // First visit to a month materializes it from the user's recurring
    // templates (server-side), so budgets always reflect tracked expenses.
    queryFn: async () => {
      const existing = await fetchBudget();
      if (existing) return existing;
      await regenerateBudgetMonth(date.year(), date.month() + 1);
      return getBudget(date.year(), date.month() + 1);
    },
  });
};
