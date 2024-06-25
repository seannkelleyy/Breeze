import { useMutation } from 'react-query';
import { useCallback } from 'react';
import { Expense, useExpenses } from './expenseServices';
import { Category } from '../category/categoryServices';

type PostExpenseProps = {
    category: Category;
    expense: Expense;
    onSuccess?: () => void;
    onSettled?: () => void;
};

/**
 * A hook for posting an expense.
 * @param props.category: The category to post the expense to.
 * @param props.expense: The expense to post.
 * @param props.onSuccess: - Optional - The function to call when the mutation is successful.
 * @param props.onSettled: - Optional - The function to call when the mutation is settled.
 */
export const usePostExpense = ({category, expense, onSuccess, onSettled}: PostExpenseProps) => {
  const { postExpense } = useExpenses();

  const mutationFn = useCallback(() => postExpense(category, expense), [category, expense, postExpense]);

  return useMutation(mutationFn, {
    onSuccess: onSuccess,
    onSettled: onSettled,
  });
};