import { useCallback } from 'react';

import { useQuery } from '@tanstack/react-query';

import { Expense } from '../../types/expense';
import { useExpenses } from './index';

interface FetchExpensesForBudgetProps {
  budgetId: number;
}

/**
 * A hook for fetching expenses.
 * @param props.budget: The category to fetch expenses from.
 */
const useFetchExpensesForBudget = ({ budgetId }: FetchExpensesForBudgetProps) => {
  const { getExpensesForBudget } = useExpenses();

  const fetchExpenses = useCallback(() => {
    if (!budgetId) return [];
    return getExpensesForBudget(budgetId);
  }, [getExpensesForBudget, budgetId]);

  return useQuery<Expense[], Error>({
    queryKey: ['expensesBudget', budgetId],
    queryFn: fetchExpenses,
    refetchInterval: 180 * 1000,
    retryDelay: 1 * 1000,
    retry: 3,
  });
};

export default useFetchExpensesForBudget;
