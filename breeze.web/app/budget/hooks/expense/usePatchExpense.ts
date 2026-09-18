import { createMutationHook } from '../createMutationHook';
import { useExpenses } from './index';
import { Expense } from '../../types/expense';

export interface PatchExpenseMutationProps {
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
