import { useAuth } from '@clerk/nextjs';
import { useCallback, useMemo } from 'react';

import { GET_BUDGET_BY_DATE } from '@/lib/services/queries/budget';
import useGraphql from '@/lib/services/useGraphql';
import { Budget } from '../../types/budget';

const useBudgets = () => {
  const { request } = useGraphql();
  const { userId } = useAuth();

  const getBudget = useCallback(
    async (year: number, month: number): Promise<Budget> => {
      // Use a default test user ID if not authenticated (for development)
      const effectiveUserId = userId || '550e8400-e29b-41d4-a716-446655440000';

      // Format date as RFC3339 (YYYY-MM-DDTHH:MM:SSZ)
      const date = new Date(year, month - 1, 1).toISOString();

      const res = await request<{ budgetByDate: Budget | null }>(GET_BUDGET_BY_DATE, {
        userId: effectiveUserId,
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
