import { useCallback } from 'react';

import { useMutation } from '@tanstack/react-query';

import { Expense } from '../../types/expense';
import { useExpenses } from './index';

interface PostExpenseProps {
  onSuccess?: () => void;
  onSettled?: () => void;
}

/**
 * A hook for posting an expense.
 * @param props.onSuccess: - Optional - The function to call when the mutation is successful.
 * @param props.onSettled: - Optional - The function to call when the mutation is settled.
 */

interface PostExpenseMutationProps {
  budgetId: string;
  userId: string;
  expense: Omit<Expense, 'id' | 'userId' | 'budgetId' | 'createdAt' | 'updatedAt'>;
}
/**
 * Mutation function for posting an expense.
 * @param props.budgetId: The budget Id to post the expense to.
 * @param props.userId: The user Id.
 * @param props.expense: The expense to post.
 */
const usePostExpense = ({ onSuccess, onSettled }: PostExpenseProps) => {
  const { postExpense } = useExpenses();

  const mutationFn = useCallback(
    ({ budgetId, userId, expense }: PostExpenseMutationProps) =>
      postExpense(budgetId, userId, expense),
    [postExpense],
  );

  return useMutation({
    mutationFn,
    onSuccess: onSuccess,
    onSettled: onSettled,
  });
};

export default usePostExpense;
