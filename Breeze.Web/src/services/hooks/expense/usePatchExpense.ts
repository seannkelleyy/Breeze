import { useMutation } from 'react-query';
import { useCallback } from 'react';
import { Expense, useExpenses } from './ExpenseServices';
import { Category } from '../category/CategoryServices';

type PatchExpenseProps = {
    category: Category;
    expense: Expense;
    onSuccess?: () => void;
    onSettled?: () => void;
};

export const usePatchExpense = ({category, expense, onSuccess, onSettled}: PatchExpenseProps) => {
  const { patchExpense } = useExpenses();

  const mutationFn = useCallback(() => patchExpense(category, expense), [category, expense, patchExpense]);

  return useMutation(mutationFn, {
    onSuccess: onSuccess,
    onSettled: onSettled,
  });
};