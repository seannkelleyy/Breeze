import { useCallback } from 'react';

import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import { GET_RECURRING_EXPENSES } from '@/lib/services/queries/budget';
import useGraphql from '@/lib/services/useGraphql';

const usePlanner = () => {
  const { request } = useGraphql();
  const { userId } = useCurrentUser();

  const getRecurringExpensesMonthlyTotal = useCallback(async (): Promise<number> => {
    const response = await request<
      {
        recurringExpenses: Array<{
          amount: string;
          recurrenceInterval: string;
        }>;
      },
      { userId: string }
    >(GET_RECURRING_EXPENSES, { userId });

    const toMonthly = (amount: number, interval: string): number => {
      switch (interval) {
        case 'WEEKLY':
          return (amount * 52) / 12;
        case 'BIWEEKLY':
          return (amount * 26) / 12;
        case 'QUARTERLY':
          return amount / 3;
        case 'YEARLY':
          return amount / 12;
        default:
          return amount;
      }
    };

    return (response.recurringExpenses ?? []).reduce(
      (sum, e) => sum + toMonthly(Number.parseFloat(e.amount) || 0, e.recurrenceInterval),
      0,
    );
  }, [request, userId]);

  return { getRecurringExpensesMonthlyTotal };
};

export default usePlanner;
