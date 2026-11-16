import { createMutationHook } from '../../../lib/hooks/createMutationHook';
import useIncomes from './useIncomes';
import { IncomeInput } from '../types';

interface PostIncomeMutationProps {
  budgetId: string;
  userId: string;
  income: IncomeInput;
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
