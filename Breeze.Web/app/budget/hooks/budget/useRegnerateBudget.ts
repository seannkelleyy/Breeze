import { CREATE_BUDGET } from '@/lib/services/queries/budget';
import useGraphql from '@/lib/services/useGraphql';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import { Budget } from '../../types/budget';

/**
 * Creates a budget for the given month if one doesn't yet exist.
 * Full recurring-template generation is a future server-side feature.
 */
export const useRegenerateBudget = () => {
  const { request } = useGraphql();
  const { userId } = useCurrentUser();

  const regenerateBudgetMonth = async (year: number, month: number): Promise<Budget> => {
    const date = new Date(year, month - 1, 1).toISOString();

    const res = await request<{ createBudget: Budget }>(CREATE_BUDGET, {
      input: {
        userId,
        date,
        monthlyIncome: '0',
        monthlyExpenses: '0',
      },
    });
    return res.createBudget;
  };

  return { regenerateBudgetMonth };
};

export default useRegenerateBudget;
