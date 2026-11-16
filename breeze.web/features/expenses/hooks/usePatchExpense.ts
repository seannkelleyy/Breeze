import { createMutationHook } from '@/lib/hooks/createMutationHook';
import useExpenses from './useExpenses';
import { Expense } from '@/features/expenses/types';

interface PatchExpenseMutationProps {
  expense: Expense;
}

/**
 * A hook for patching an expense.
 * Accepts optional onSuccess/onSettled callbacks.
 */
const usePatchExpense = createMutationHook(
  useExpenses,
  ({ patchExpense }) =>
    ({ expense }: PatchExpenseMutationProps) =>
      patchExpense(expense),
);

export default usePatchExpense;
