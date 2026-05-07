'use client';
import { useQuery } from '@tanstack/react-query'
import { GET_EXPENSES_BY_BUDGET } from '../queries/budget'
import useGraphql from '../useGraphql'

export interface ExpenseItem {
  id: number;
  userId: string;
  name: string;
  amount: string;
  categoryId: number;
  recurrenceInterval?: string;
  dueDayOfMonth?: number | null;
  sourceType?: string;
}

export const useExpenses = (budgetId: number | null, enabled = true) => {
  const { request } = useGraphql();

  return useQuery({
    queryKey: ['expenses', budgetId],
    queryFn: async () => {
      if (!budgetId) return [] as ExpenseItem[];
      return request<{ getExpensesByBudget: ExpenseItem[] }>(GET_EXPENSES_BY_BUDGET, {
        budgetId,
      } as unknown as Record<string, unknown>);
    },
    select: (data) => (Array.isArray(data) ? data : data?.getExpensesByBudget ?? []),
    enabled: enabled && !!budgetId,
  });
};
