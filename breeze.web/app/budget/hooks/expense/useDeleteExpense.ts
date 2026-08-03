import { useCallback } from 'react';

import { useMutation } from '@tanstack/react-query';

import { Expense } from '../../types/expense';
import { useExpenses } from './index';

interface DeleteExpenseProps {
  onSuccess?: () => void;
  onSettled?: () => void;
}

/**
 * A hook for deleting an expense.
 * @param props.onSuccess: - Optional - The function to call when the mutation is successful.
 * @param props.onSettled: - Optional - The function to call when the mutation is settled.
 */

interface DeleteExpenseMutationProps {
  expense: Expense;
}

/**
 * Mutation function for deleting an expense.
 * @param props.expense: The expense to delete.
 */

const useDeleteExpense = ({ onSuccess, onSettled }: DeleteExpenseProps) => {
  const { deleteExpense } = useExpenses();

  const mutationFn = useCallback(
    ({ expense }: DeleteExpenseMutationProps) => deleteExpense(expense.id),
    [deleteExpense],
  );

  return useMutation({
    mutationFn,
    onSuccess: onSuccess,
    onSettled: onSettled,
  });
};

export default useDeleteExpense;
