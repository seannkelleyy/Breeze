import { useMutation } from 'react-query';
import { useCallback } from 'react';
import { Expense, useExpenses } from './expenseServices';
import { Category } from '../category/categoryServices';

type DeleteExpenseProps = {
    category: Category;
    expense: Expense;
    onSuccess?: () => void;
    onSettled?: () => void;
};

/**
 * A hook for deleting an expense.
 * @param props.category: The category to delete the expense from.
 * @param props.expense: The expense to delete.
 * @param props.onSuccess: - Optional - The function to call when the mutation is successful.
 * @param props.onSettled: - Optional - The function to call when the mutation is settled.
 */
export const useDeleteExpense = ({category, expense, onSuccess, onSettled}: DeleteExpenseProps) => {
  const { deleteExpense } = useExpenses();

  const mutationFn = useCallback(() => deleteExpense(category, expense), [category, expense, deleteExpense]);

  return useMutation(mutationFn, {
    onSuccess: onSuccess,
    onSettled: onSettled,
  });
};