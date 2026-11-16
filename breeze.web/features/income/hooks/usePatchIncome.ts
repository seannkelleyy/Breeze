import { createMutationHook } from '../../../lib/hooks/createMutationHook';
import useIncomes from './useIncomes';
import { Income } from '../types';

interface PatchIncomeMutationProps {
  income: Income;
}

/**
 * A hook for patching an income.
 * Accepts optional onSuccess/onSettled callbacks.
 */
const usePatchIncome = createMutationHook(
  useIncomes,
  ({ patchIncome }) =>
    ({ income }: PatchIncomeMutationProps) =>
      patchIncome(income),
);

export default usePatchIncome;
