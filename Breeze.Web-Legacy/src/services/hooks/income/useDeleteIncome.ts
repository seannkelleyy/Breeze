import { useMutation } from 'react-query';
import { useCallback } from 'react';
import { Income, useIncomes } from './incomeServices';

type DeleteIncomeProps = {
    onSuccess?: () => void;
    onSettled?: () => void;
};

/**
 * A hook for deleting an income.
 * @param props.onSuccess: - Optional - The function to call when the mutation is successful.
 * @param props.onSettled: - Optional - The function to call when the mutation is settled.
 */

type DeleteIncomeMutationProps = {
  income: Income;
};

/**
 * Mutation function for deleting an income.
 * @param props.income: The income to delete.
 */

export const useDeleteIncome = ({onSuccess, onSettled}: DeleteIncomeProps) => {
  const { deleteIncome } = useIncomes();

  const mutationFn = useCallback(({income}: DeleteIncomeMutationProps) => deleteIncome(income), [deleteIncome]);

  return useMutation(mutationFn, {
    onSuccess: onSuccess,
    onSettled: onSettled,
  });
};