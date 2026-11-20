import { createMutationHook } from '@/lib/hooks/createMutationHook';
import useExpenses from './useExpenses';
import { ExpenseInput } from '@/features/expenses/types';

interface PostExpenseMutationProps {
  budgetId: string;
  expense: ExpenseInput;
}

/**
 * A hook for posting an expense.
 * Accepts optional onSuccess/onSettled callbacks.
 */
const usePostExpense = createMutationHook(
  useExpenses,
  ({ postExpense }) =>
    ({ budgetId, expense }: PostExpenseMutationProps) =>
      postExpense(budgetId, expense),
);

export default usePostExpense;
