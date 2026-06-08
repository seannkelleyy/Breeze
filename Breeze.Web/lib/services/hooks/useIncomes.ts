'use client';
import { useQuery } from '@tanstack/react-query';
import { GET_INCOMES_BY_BUDGET } from '../queries/budget';
import useGraphql from '../useGraphql';

export interface IncomeItem {
  id: string;
  userId: string;
  budgetId: string;
  name: string;
  amount: string;
  date: string;
  sourceType: string;
  sourceTemplateId: string | null;
  sourceOccurrenceDate: string | null;
  generationMonth: string | null;
  createdAt: string;
  updatedAt: string;
}

export const useIncomes = (budgetId: number | null, enabled = true) => {
  const { request } = useGraphql();

  return useQuery({
    queryKey: ['incomes', budgetId],
    queryFn: async () => {
      if (!budgetId) return [] as IncomeItem[];
      return request<{ getIncomesByBudget: IncomeItem[] }>(GET_INCOMES_BY_BUDGET, {
        budgetId,
      } as unknown as Record<string, unknown>);
    },
    select: (data) => (Array.isArray(data) ? data : (data?.getIncomesByBudget ?? [])),
    enabled: enabled && !!budgetId,
  });
};
