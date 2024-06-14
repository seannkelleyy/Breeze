import { useMutation } from 'react-query';
import { useCallback } from 'react';
import { Income, useIncomes } from '../httpServices/IncomeServices';

type DeleteIncomeProps = {
    income: Income;
    onSuccess?: () => void;
    onSettled?: () => void;
};

export const useDeleteIncome = ({income, onSuccess, onSettled}: DeleteIncomeProps) => {
  const { deleteIncome } = useIncomes();

  const mutationFn = useCallback(() => deleteIncome(income), [income, deleteIncome]);

  return useMutation(mutationFn, {
    onSuccess: onSuccess,
    onSettled: onSettled,
  });
};