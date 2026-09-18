import { createMutationHook } from '../createMutationHook';
import { useExpenses } from './index';
import { Expense } from '../../types/expense';

export interface PostExpenseMutationProps {
  budgetId: string;
  userId: string;
  expense: Omit<Expense, 'id' | 'userId' | 'budgetId' | 'createdAt' | 'updatedAt'>;
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
