import { useCallback, useMemo } from 'react';

import { GET_BUDGET_BY_DATE } from '@/lib/services/queries/budget';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import useGraphql from '@/lib/services/useGraphql';
import { Budget } from '../../types/budget';

const useBudgets = () => {
  const { request } = useGraphql();
  const { userId } = useCurrentUser();

  const getBudget = useCallback(
    async (year: number, month: number): Promise<Budget | null> => {
      const date = new Date(year, month - 1, 1).toISOString();

      const res = await request<{ budgetByDate: Budget | null }>(GET_BUDGET_BY_DATE, {
        userId,
        date,
      } as Record<string, unknown>);
      return res?.budgetByDate ?? null;
    },
    [request, userId],
  );

  return useMemo(() => ({ getBudget }), [getBudget]);
};

export default useBudgets;
