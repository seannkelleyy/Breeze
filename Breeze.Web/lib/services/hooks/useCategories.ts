'use client';
import { useQuery } from '@tanstack/react-query'
import { GET_CATEGORIES } from '../queries/budget'
import useGraphql from '../useGraphql'

export interface CategoryItem {
  id: number;
  userId: string;
  name: string;
  color?: string | null;
  sourceType?: string;
}

export const useCategories = (budgetId?: number | null, enabled = true) => {
  const { request } = useGraphql();

  return useQuery({
    queryKey: ['categories', budgetId],
    queryFn: async () => {
      return request<{ getCategories: CategoryItem[] }>(GET_CATEGORIES, {
        budgetId: budgetId ?? null,
      } as unknown as Record<string, unknown>);
    },
    select: (data) => data?.getCategories ?? [],
    enabled,
  });
};
