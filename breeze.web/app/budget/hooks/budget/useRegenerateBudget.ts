import { CREATE_BUDGET } from '@/lib/services/queries/budget';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import useGraphql from '@/lib/services/useGraphql';
import { Budget } from '../../types/budget';

/**
 * Creates (or regenerates) the budget for a month. The server materializes
 * the month's expense categories, expenses, and incomes from the user's
 * recurring templates, then recalculates the monthly totals.
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
