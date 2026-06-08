'use client';
import { useQuery } from '@tanstack/react-query';
import { GET_BUDGET_BY_DATE } from '../queries/budget';
import useGraphql from '../useGraphql';

export interface Budget {
  id: string;
  userId: string;
  date: string;
  monthlyIncome: string;
  monthlyExpenses: string;
  createdAt: string;
  updatedAt: string;
}

export const useBudget = (year: number, month: number, enabled = true) => {
  const { request } = useGraphql();

  return useQuery({
    queryKey: ['budget', year, month],
    queryFn: async () => {
      return request<{ getBudgetByDate: Budget | null }>(GET_BUDGET_BY_DATE, {
        year,
        month,
      } as unknown as Record<string, unknown>);
    },
    select: (data) => data.getBudgetByDate ?? null,
    enabled,
  });
};
