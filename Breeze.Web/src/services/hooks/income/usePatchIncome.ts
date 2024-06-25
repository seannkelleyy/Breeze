import { useMutation } from 'react-query';
import { useCallback } from 'react';
import { Income, useIncomes } from './incomeServicess';

type PatchIncomeProps = {
    income: Income;
    onSuccess?: () => void;
    onSettled?: () => void;
};

/**
 * A hook for patching an income.
 * @param props.income: The income to patch.
 * @param props.onSuccess: - Optional - The function to call when the mutation is successful.
 * @param props.onSettled: - Optional - The function to call when the mutation is settled.
 */
export const usePatchIncome = ({income, onSuccess, onSettled}: PatchIncomeProps) => {
  const { patchIncome } = useIncomes();

  const mutationFn = useCallback(() => patchIncome(income), [income, patchIncome]);

  return useMutation(mutationFn, {
    onSuccess: onSuccess,
    onSettled: onSettled,
  });
};