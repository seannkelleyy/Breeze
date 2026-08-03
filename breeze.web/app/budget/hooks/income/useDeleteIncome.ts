import { useCallback } from 'react';

import { useMutation } from '@tanstack/react-query';
import { Income } from '../../types/income';
import { useIncomes } from './index';

interface DeleteIncomeProps {
  onSuccess?: () => void;
  onSettled?: () => void;
}

/**
 * A hook for deleting an income.
 * @param props.onSuccess: - Optional - The function to call when the mutation is successful.
 * @param props.onSettled: - Optional - The function to call when the mutation is settled.
 */

interface DeleteIncomeMutationProps {
  income: Income;
}

/**
 * Mutation function for deleting an income.
 * @param props.income: The income to delete.
 */

const useDeleteIncome = ({ onSuccess, onSettled }: DeleteIncomeProps) => {
  const { deleteIncome } = useIncomes();

  const mutationFn = useCallback(
    ({ income }: DeleteIncomeMutationProps) => deleteIncome(income.id),
    [deleteIncome],
  );

  return useMutation({
    mutationFn,
    onSuccess: onSuccess,
    onSettled: onSettled,
  });
};

export default useDeleteIncome;
