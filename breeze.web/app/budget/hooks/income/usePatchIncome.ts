import { useCallback } from 'react';

import { useMutation } from '@tanstack/react-query';
import { Income } from '../../types/income';
import { useIncomes } from './index';

interface PatchIncomeProps {
  onSuccess?: () => void;
  onSettled?: () => void;
}

/**
 * A hook for patching an income.
 * @param props.onSuccess: - Optional - The function to call when the mutation is successful.
 * @param props.onSettled: - Optional - The function to call when the mutation is settled.
 */

interface PatchIncomeMutationProps {
  income: Income;
}

/**
 * Mutation function for patching an income.
 * @param props.income: The income to patch.
 */

const usePatchIncome = ({ onSuccess, onSettled }: PatchIncomeProps) => {
  const { patchIncome } = useIncomes();

  const mutationFn = useCallback(
    ({ income }: PatchIncomeMutationProps) => patchIncome(income),
    [patchIncome],
  );

  return useMutation({
    mutationFn,
    onSuccess: onSuccess,
    onSettled: onSettled,
  });
};

export default usePatchIncome;
