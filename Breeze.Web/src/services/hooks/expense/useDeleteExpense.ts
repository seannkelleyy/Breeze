import { useMutation } from 'react-query';
import { useCallback } from 'react';
import { Expense, useExpenses } from './expenseServices';
import { Category } from '../category/categoryServices';

type DeleteExpenseProps = {
    onSuccess?: () => void;
    onSettled?: () => void;
};

/**
 * A hook for deleting an expense.
 * @param props.onSuccess: - Optional - The function to call when the mutation is successful.
 * @param props.onSettled: - Optional - The function to call when the mutation is settled.
 */

 type DeleteExpenseMutationProps = {
    category: Category;
    expense: Expense;
}

/**
* Mutation function for deleting an expense.
* @param props.category: The category to delete the expense from.
* @param props.expense: The expense to delete.
*/

export const useDeleteExpense = ({onSuccess, onSettled}: DeleteExpenseProps) => {
  const { deleteExpense } = useExpenses();

  const mutationFn = useCallback(({category, expense}: DeleteExpenseMutationProps) => deleteExpense(category, expense), [deleteExpense]);

  return useMutation(mutationFn, {
    onSuccess: onSuccess,
    onSettled: onSettled,
  });
};