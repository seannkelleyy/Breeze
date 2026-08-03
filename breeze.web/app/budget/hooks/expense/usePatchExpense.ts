import { useCallback } from 'react';

import { useMutation } from '@tanstack/react-query';

import { Expense } from '../../types/expense';
import { useExpenses } from './index';

interface PatchExpenseProps {
  onSuccess?: () => void;
  onSettled?: () => void;
}

/**
 * A hook for patching an expense.
 * @param props.onSuccess: - Optional - The function to call when the mutation is successful.
 * @param props.onSettled: - Optional - The function to call when the mutation is settled.
 */

interface PatchExpenseMutationProps {
  expense: Expense;
}

/**
 * Mutation function for patching an expense.
 * @param props.expense: The expense to patch.
 */

const usePatchExpense = ({ onSuccess, onSettled }: PatchExpenseProps) => {
  const { patchExpense } = useExpenses();

  const mutationFn = useCallback(
    ({ expense }: PatchExpenseMutationProps) => patchExpense(expense),
    [patchExpense],
  );

  return useMutation({
    mutationFn,
    onSuccess: onSuccess,
    onSettled: onSettled,
  });
};

export default usePatchExpense;
