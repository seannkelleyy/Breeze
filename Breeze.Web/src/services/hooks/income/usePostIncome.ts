import { useMutation } from 'react-query';
import { useCallback } from 'react';
import { Income, useIncomes } from './IncomeServices';

type PostIncomeProps = {
    income: Income;
    onSuccess?: () => void;
    onSettled?: () => void;
};

export const usePostIncome = ({income, onSuccess, onSettled}: PostIncomeProps) => {
  const { postIncome } = useIncomes();

  const mutationFn = useCallback(() => postIncome(income), [income, postIncome]);

  return useMutation(mutationFn, {
    onSuccess: onSuccess,
    onSettled: onSettled,
  });
};