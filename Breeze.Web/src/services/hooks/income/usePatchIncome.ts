import { useMutation } from 'react-query';
import { useCallback } from 'react';
import { Income, useIncomes } from '../httpServices/IncomeServices';

type PatchIncomeProps = {
    income: Income;
    onSuccess?: () => void;
    onSettled?: () => void;
};

export const usePatchIncome = ({income, onSuccess, onSettled}: PatchIncomeProps) => {
  const { patchIncome } = useIncomes();

  const mutationFn = useCallback(() => patchIncome(income), [income, patchIncome]);

  return useMutation(mutationFn, {
    onSuccess: onSuccess,
    onSettled: onSettled,
  });
};