import { useMutation } from 'react-query';
import { useCallback } from 'react';
import { Expense, useExpenses } from './expenseServices';
import { Category } from '../category/categoryServices';

type PatchExpenseProps = {
    onSuccess?: () => void;
    onSettled?: () => void;
};

/**
 * A hook for patching an expense.
 * @param props.onSuccess: - Optional - The function to call when the mutation is successful.
 * @param props.onSettled: - Optional - The function to call when the mutation is settled.
 */

type PatchExpenseMutationProps = {
    category: Category;
    expense: Expense;
}

/**
* Mutation function for patching an expense.
* @param props.category: The category to patch the expense from.
* @param props.expense: The expense to patch.
*/

export const usePatchExpense = ({onSuccess, onSettled}: PatchExpenseProps) => {
  const { patchExpense } = useExpenses();

  const mutationFn = useCallback(({category, expense}: PatchExpenseMutationProps) => patchExpense(category, expense), [patchExpense]);

  return useMutation(mutationFn, {
    onSuccess: onSuccess,
    onSettled: onSettled,
  });
};