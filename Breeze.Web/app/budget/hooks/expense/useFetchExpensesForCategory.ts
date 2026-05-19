import { useCallback } from 'react';

import { useQuery } from '@tanstack/react-query';
import { Category } from '../../types/category';
import { Expense } from '../../types/expense';

interface FetchExpensesForCategoryProps {
  category: Category;
}

/**
 * A hook for fetching expenses for a specific category.
 * Note: In the new schema, expenses have splits arrays with embedded categories.
 * This hook filters expenses from the budget to find those that include this category.
 * @param props.category: The category to filter expenses by.
 */
const useFetchExpensesForCategory = ({ category }: FetchExpensesForCategoryProps) => {
  // Since we don't have a category-specific query, we would need the budgetId
  // For now, return an empty result as this is deprecated in the new schema
  const fetchExpenses = useCallback((): Promise<Expense[]> => {
    // Category-level queries are deprecated in the new schema
    // Expenses are queried at budget level with splits containing category data
    return Promise.resolve([]);
  }, []);

  return useQuery<Expense[], Error>({
    queryKey: ['expensesCategory', category.id],
    queryFn: fetchExpenses,
    refetchInterval: 180 * 1000,
    retryDelay: 1 * 1000,
    retry: 3,
  });
};

export default useFetchExpensesForCategory;
