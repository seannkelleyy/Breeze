'use client';
import { useQuery } from '@tanstack/react-query';
import { GET_EXPENSES_BY_BUDGET } from '../queries/budget';
import useGraphql from '../useGraphql';

export interface ExpenseItem {
  id: string;
  userId: string;
  budgetId: string;
  amount: string;
  date: string;
  description: string;
  splits: ExpenseSplit[];
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseSplit {
  id: string;
  expenseId: string;
  categoryId: string;
  amount: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
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
    select: (data) => (Array.isArray(data) ? data : (data?.getExpensesByBudget ?? [])),
    enabled: enabled && !!budgetId,
  });
};
