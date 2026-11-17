import { useQuery } from '@tanstack/react-query';

import { Expense } from '@/features/expenses/types';
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

  const fetchExpenses = () => {
    if (!enabled) return [];
    return getExpensesForBudget(budgetId);
  };

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
