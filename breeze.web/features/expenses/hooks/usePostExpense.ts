import { createMutationHook } from '@/lib/hooks/createMutationHook';
import useExpenses from './useExpenses';
import { ExpenseInput } from '@/features/expenses/types';

interface PostExpenseMutationProps {
  budgetId: string;
  userId: string;
  expense: ExpenseInput;
}

/**
 * A hook for posting an expense.
 * Accepts optional onSuccess/onSettled callbacks.
 */
const usePostExpense = createMutationHook(
  useExpenses,
  ({ postExpense }) =>
    ({ budgetId, userId, expense }: PostExpenseMutationProps) =>
      postExpense(budgetId, userId, expense),
);

export default usePostExpense;
