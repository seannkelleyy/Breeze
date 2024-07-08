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

type PostIncomeMutationProps = {
  income: Income;
};

/**
 * Mutation function for posting an income.
  * @param props.income: The income to post.
 */
 
export const usePostIncome = ({onSuccess, onSettled}: PostIncomeProps) => {
  const { postIncome } = useIncomes();

  const mutationFn = useCallback(({income} : PostIncomeMutationProps) => postIncome(income), [ postIncome]);

  return useMutation(mutationFn, {
    onSuccess: onSuccess,
    onSettled: onSettled,
  });
};