import { useMutation } from 'react-query';
import { useCallback } from 'react';
import { Expense, useExpenses } from './expenseServices';
import { Category } from '../category/categoryServices';

type PatchExpenseProps = {
    category: Category;
    expense: Expense;
    onSuccess?: () => void;
    onSettled?: () => void;
};

/**
 * A hook for patching an expense.
 * @param props.category: The category to patch the expense from.
 * @param props.expense: The expense to patch.
 * @param props.onSuccess: - Optional - The function to call when the mutation is successful.
 * @param props.onSettled: - Optional - The function to call when the mutation is settled.
 */
export const usePatchExpense = ({category, expense, onSuccess, onSettled}: PatchExpenseProps) => {
  const { patchExpense } = useExpenses();

  const mutationFn = useCallback(() => patchExpense(category, expense), [category, expense, patchExpense]);

  return useMutation(mutationFn, {
    onSuccess: onSuccess,
    onSettled: onSettled,
  });
};