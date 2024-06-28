import { useMutation } from 'react-query';
import { useCallback } from 'react';
import { Income, useIncomes } from './incomeServices';

type PostIncomeProps = {
    onSuccess?: () => void;
    onSettled?: () => void;
};

/**
 * A hook for posting an income.
 * @param props.onSuccess: - Optional - The function to call when the mutation is successful.
 * @param props.onSettled: - Optional - The function to call when the mutation is settled.
 */
export const usePostIncome = ({ onSuccess, onSettled }: Omit<PostIncomeProps, 'income'>) => {
  const { postIncome } = useIncomes();

  const mutationFn = useCallback((income: Income) => postIncome(income), [postIncome]);

  return useMutation(mutationFn, {
    onSuccess: onSuccess,
    onSettled: onSettled,
  });
};