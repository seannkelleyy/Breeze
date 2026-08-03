import { useCallback } from 'react';

import { useQuery } from '@tanstack/react-query';

import { Expense } from '../../types/expense';
import { useExpenses } from './index';

interface FetchExpensesForBudgetProps {
  budgetId: string;
  enabled?: boolean;
}

/**
 * A hook for fetching expenses.
 * @param props.budget: The category to fetch expenses from.
 */
const useFetchExpensesForBudget = ({ budgetId, enabled }: FetchExpensesForBudgetProps) => {
  const { getExpensesForBudget } = useExpenses();

  const fetchExpenses = useCallback(() => {
    if (!enabled) return [];
    return getExpensesForBudget(budgetId);
  }, [getExpensesForBudget, budgetId, enabled]);

  return useQuery<Expense[], Error>({
    queryKey: ['expensesBudget', budgetId],
    queryFn: fetchExpenses,
    refetchInterval: 180 * 1000,
    retryDelay: 1 * 1000,
    retry: 3,
    enabled,
  });
};

export default useFetchExpensesForBudget;
