import { useMutation } from 'react-query';
import { useCallback } from 'react';
import { Income, useIncomes } from './incomeServices';

type PatchIncomeProps = {
    onSuccess?: () => void;
    onSettled?: () => void;
};

/**
 * A hook for patching an income.
 * @param props.onSuccess: - Optional - The function to call when the mutation is successful.
 * @param props.onSettled: - Optional - The function to call when the mutation is settled.
 */

type PatchIncomeMutationProps = {
  income: Income;
};

/**
 * Mutation function for patching an income.
  * @param props.income: The income to patch.
 */

export const usePatchIncome = ({onSuccess, onSettled}: PatchIncomeProps) => {
  const { patchIncome } = useIncomes();

  const mutationFn = useCallback(({income}: PatchIncomeMutationProps) => patchIncome(income), [patchIncome]);

  return useMutation(mutationFn, {
    onSuccess: onSuccess,
    onSettled: onSettled,
  });
};