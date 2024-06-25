import { useMutation } from 'react-query';
import { useCallback } from 'react';
import { Income, useIncomes } from './incomeServices';

type PostIncomeProps = {
    income: Income;
    onSuccess?: () => void;
    onSettled?: () => void;
};

/**
 * A hook for posting an income.
 * @param props.income: The income to post.
 * @param props.onSuccess: - Optional - The function to call when the mutation is successful.
 * @param props.onSettled: - Optional - The function to call when the mutation is settled.
 */
export const usePostIncome = ({income, onSuccess, onSettled}: PostIncomeProps) => {
  const { postIncome } = useIncomes();

  const mutationFn = useCallback(() => postIncome(income), [income, postIncome]);

  return useMutation(mutationFn, {
    onSuccess: onSuccess,
    onSettled: onSettled,
  });
};