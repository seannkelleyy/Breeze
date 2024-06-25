import { useMutation } from 'react-query';
import { useCallback } from 'react';
import { Income, useIncomes } from './incomeServicess';

type DeleteIncomeProps = {
    income: Income;
    onSuccess?: () => void;
    onSettled?: () => void;
};

/**
 * A hook for deleting an income.
 * @param props.income: The income to delete.
 * @param props.onSuccess: - Optional - The function to call when the mutation is successful.
 * @param props.onSettled: - Optional - The function to call when the mutation is settled.
 */
export const useDeleteIncome = ({income, onSuccess, onSettled}: DeleteIncomeProps) => {
  const { deleteIncome } = useIncomes();

  const mutationFn = useCallback(() => deleteIncome(income), [income, deleteIncome]);

  return useMutation(mutationFn, {
    onSuccess: onSuccess,
    onSettled: onSettled,
  });
};