import { createMutationHook } from '../../../lib/hooks/createMutationHook';
import useIncomes from './useIncomes';
import { Income } from '../types';

interface DeleteIncomeMutationProps {
  income: Income;
}

/**
 * A hook for deleting an income.
 * Accepts optional onSuccess/onSettled callbacks.
 */
const useDeleteIncome = createMutationHook(
  useIncomes,
  ({ deleteIncome }) =>
    ({ income }: DeleteIncomeMutationProps) =>
      deleteIncome(income.id),
);

export default useDeleteIncome;
