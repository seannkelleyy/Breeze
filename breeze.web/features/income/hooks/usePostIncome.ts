import { createMutationHook } from '../../../lib/hooks/createMutationHook';
import useIncomes from './useIncomes';
import { IncomeInput } from '../types';

interface PostIncomeMutationProps {
  budgetId: string;
  income: IncomeInput;
}

/**
 * A hook for posting an income.
 * Accepts optional onSuccess/onSettled callbacks.
 */
const usePostIncome = createMutationHook(
  useIncomes,
  ({ postIncome }) =>
    ({ budgetId, income }: PostIncomeMutationProps) =>
      postIncome(budgetId, income),
);

export default usePostIncome;
