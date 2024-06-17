import { useMutation } from 'react-query';
import { useCallback } from 'react';
import { Expense, useExpenses } from './ExpenseServices';
import { Category } from '../category/CategoryServices';

type PostExpenseProps = {
    category: Category;
    expense: Expense;
    onSuccess?: () => void;
    onSettled?: () => void;
};

export const usePostExpense = ({category, expense, onSuccess, onSettled}: PostExpenseProps) => {
  const { postExpense } = useExpenses();

  const mutationFn = useCallback(() => postExpense(category, expense), [category, expense, postExpense]);

  return useMutation(mutationFn, {
    onSuccess: onSuccess,
    onSettled: onSettled,
  });
};