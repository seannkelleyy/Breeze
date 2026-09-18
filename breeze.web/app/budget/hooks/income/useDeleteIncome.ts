import { createMutationHook } from '../createMutationHook';
import { useIncomes } from './index';
import { Income } from '../../types/income';

export interface DeleteIncomeMutationProps {
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
