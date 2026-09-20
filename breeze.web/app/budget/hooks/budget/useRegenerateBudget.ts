import { CREATE_BUDGET } from '@/lib/services/queries/budget';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import useGraphql from '@/lib/services/useGraphql';
import { Budget } from '../../types/budget';
import type { PayrollIncomeItem } from '../../../future/lib/paycheck';

/**
 * Creates (or regenerates) the budget for a month. The server materializes
 * the month's expense categories, expenses, and incomes from the user's
 * recurring templates, then recalculates the monthly totals.
 *
 * When `payrollIncomes` is provided (per-person payday net amounts computed
 * from the People page waterfall), the budget's paycheck income rows are
 * replaced with them; when omitted, existing payroll rows are left untouched.
 */
export const useRegenerateBudget = () => {
  const { request } = useGraphql();
  const { userId } = useCurrentUser();

  const regenerateBudgetMonth = async (
    year: number,
    month: number,
    payrollIncomes?: PayrollIncomeItem[],
  ): Promise<Budget> => {
    const date = new Date(year, month - 1, 1).toISOString();

    const res = await request<{ createBudget: Budget }>(CREATE_BUDGET, {
      input: {
        userId,
        date,
        monthlyIncome: '0',
        monthlyExpenses: '0',
        ...(payrollIncomes
          ? {
              payrollIncomes: payrollIncomes.map((i) => ({
                personId: i.personId,
                name: i.name,
                amount: String(i.amount),
                date: i.date,
              })),
            }
          : {}),
      },
    });
    return res.createBudget;
  };

  return { regenerateBudgetMonth };
};

export default useRegenerateBudget;
