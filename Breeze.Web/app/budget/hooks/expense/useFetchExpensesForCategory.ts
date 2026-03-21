import { useCallback } from 'react';

import { useQuery } from '@tanstack/react-query';
import { Category } from '../../types/category';
import { Expense } from '../../types/expense';
import { useExpenses } from './index';

interface FetchExpensesForCategoryProps {
  category: Category;
}

/**
 * A hook for fetching expenses.
 * @param props.category: The category to fetch expenses from.
 */
const useFetchExpensesForCategory = ({ category }: FetchExpensesForCategoryProps) => {
  const { getExpensesForCategory } = useExpenses();

  const fetchExpenses = useCallback(() => {
    if (!category) return [];
    return getExpensesForCategory(category);
  }, [getExpensesForCategory, category]);

  return useQuery<Expense[], Error>({
    queryKey: ['expensesCategory', category],
    queryFn: fetchExpenses,
    refetchInterval: 180 * 1000,
    retryDelay: 1 * 1000,
    retry: 3,
  });
};

export default useFetchExpensesForCategory;
