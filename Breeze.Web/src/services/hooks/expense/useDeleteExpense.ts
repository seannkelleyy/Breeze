import { useMutation } from 'react-query';
import { useCallback } from 'react';
import { Expense, useExpenses } from './ExpenseServices';
import { Category } from '../category/CategoryServices';

type DeleteExpenseProps = {
    category: Category;
    expense: Expense;
    onSuccess?: () => void;
    onSettled?: () => void;
};

export const useDeleteExpense = ({category, expense, onSuccess, onSettled}: DeleteExpenseProps) => {
  const { deleteExpense } = useExpenses();

  const mutationFn = useCallback(() => deleteExpense(category, expense), [category, expense, deleteExpense]);

  return useMutation(mutationFn, {
    onSuccess: onSuccess,
    onSettled: onSettled,
  });
};