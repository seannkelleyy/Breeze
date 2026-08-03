import { useCallback } from 'react';

import { useMutation } from '@tanstack/react-query';
import { Income } from '../../types/income';
import { useIncomes } from './index';

interface PostIncomeProps {
  onSuccess?: () => void;
  onSettled?: () => void;
}

/**
 * A hook for posting an income.
 * @param props.onSuccess: - Optional - The function to call when the mutation is successful.
 * @param props.onSettled: - Optional - The function to call when the mutation is settled.
 */

interface PostIncomeMutationProps {
  budgetId: string;
  userId: string;
  income: Omit<Income, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'sourceType'>;
}

/**
 * Mutation function for posting an income.
 * @param props.budgetId: The budget Id to post the income to.
 * @param props.userId: The user Id.
 * @param props.income: The income to post.
 */

const usePostIncome = ({ onSuccess, onSettled }: PostIncomeProps) => {
  const { postIncome } = useIncomes();

  const mutationFn = useCallback(
    ({ budgetId, userId, income }: PostIncomeMutationProps) => postIncome(budgetId, userId, income),
    [postIncome],
  );

  return useMutation({
    mutationFn,
    onSuccess: onSuccess,
    onSettled: onSettled,
  });
};

export default usePostIncome;
