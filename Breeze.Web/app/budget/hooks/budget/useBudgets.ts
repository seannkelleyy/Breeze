import { useCallback, useMemo } from 'react';

import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import { GET_BUDGET_BY_DATE } from '@/lib/services/queries/budget';
import useGraphql from '@/lib/services/useGraphql';
import { Budget } from '../../types/budget';

const useBudgets = () => {
  const { request } = useGraphql();
  const { userId } = useCurrentUser();

  const getBudget = useCallback(
    async (year: number, month: number): Promise<Budget> => {
      // Format date as RFC3339 (YYYY-MM-DDTHH:MM:SSZ)
      const date = new Date(year, month - 1, 1).toISOString();

      const res = await request<{ budgetByDate: Budget | null }>(GET_BUDGET_BY_DATE, {
        userId,
        date,
      } as unknown as Record<string, unknown>);
      if (!res || !res.budgetByDate) throw new Error('No budget found');
      return res.budgetByDate;
    },
    [request, userId],
  );

  return useMemo(() => ({ getBudget }), [getBudget]);
};

export default useBudgets;
