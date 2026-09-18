import { createMutationHook } from '../createMutationHook';
import { useIncomes } from './index';
import { Income } from '../../types/income';

export interface PatchIncomeMutationProps {
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
