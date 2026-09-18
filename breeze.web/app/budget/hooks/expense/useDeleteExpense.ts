import { createMutationHook } from '../createMutationHook';
import { useExpenses } from './index';
import { Expense } from '../../types/expense';

export interface DeleteExpenseMutationProps {
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
