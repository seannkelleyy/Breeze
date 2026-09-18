import { createMutationHook } from '../createMutationHook';
import { useIncomes } from './index';
import { Income } from '../../types/income';

export interface PostIncomeMutationProps {
  budgetId: string;
  userId: string;
  income: Omit<Income, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'sourceType'>;
}

/**
 * A hook for posting an income.
 * Accepts optional onSuccess/onSettled callbacks.
 */
const usePostIncome = createMutationHook(
  useIncomes,
  ({ postIncome }) =>
    ({ budgetId, userId, income }: PostIncomeMutationProps) =>
      postIncome(budgetId, userId, income),
);

export default usePostIncome;
