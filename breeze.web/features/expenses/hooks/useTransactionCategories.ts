'use client';

import { useQuery } from '@tanstack/react-query';

import { GET_BUDGET_BY_DATE } from '@/features/budget/budget.operations';
import { GET_CATEGORIES } from '@/features/categories/category.queries';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import useGraphql from '@/lib/services/useGraphql';

interface CategoryOption {
  id: string;
  name: string;
}

export function useTransactionCategories() {
  const { userId } = useCurrentUser();
  const { request } = useGraphql();
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const monthKey = [today.getFullYear(), month].join('-');

  return useQuery<CategoryOption[]>({
    queryKey: ['transactionCategories', userId, monthKey],
    enabled: Boolean(userId),
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const budgetResponse = await request(GET_BUDGET_BY_DATE, { date: monthKey + '-01' });
      const budgetId = budgetResponse.budgetByDate?.id;
      if (!budgetId) return [];

      const categoriesResponse = await request(GET_CATEGORIES, { budgetId });
      return categoriesResponse.expenseCategories ?? [];
    },
  });
}
