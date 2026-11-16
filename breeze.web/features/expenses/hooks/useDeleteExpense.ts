import { createMutationHook } from '@/lib/hooks/createMutationHook';
import useExpenses from './useExpenses';
import { Expense } from '@/features/expenses/types';

interface DeleteExpenseMutationProps {
  expense: Expense;
}

/**
 * A hook for deleting an expense.
 * Accepts optional onSuccess/onSettled callbacks.
 */
const useDeleteExpense = createMutationHook(
  useExpenses,
  ({ deleteExpense }) =>
    ({ expense }: DeleteExpenseMutationProps) =>
      deleteExpense(expense.id),
);

export default useDeleteExpense;
