import { useCallback, useMemo } from 'react';

import { CREATE_INCOME, DELETE_INCOME, UPDATE_INCOME } from '@/features/income/income.mutations';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import useGraphql from '@/lib/services/useGraphql';
import { Income, IncomeInput } from '../types';
import { GET_INCOMES_BY_BUDGET } from '@/features/income/income.queries';

/**
 * A hook for fetching and mutating incomes via GraphQL.
 */
const useIncomes = () => {
  const { request } = useGraphql();
  const { userId } = useCurrentUser();

  const getIncomes = useCallback(
    async (budgetId: string): Promise<Income[]> => {
      const resp = await request(GET_INCOMES_BY_BUDGET, {
        budgetId,
      });
      return resp?.incomes ?? [];
    },
    [request],
  );

  const postIncome = useCallback(
    async (budgetId: string, _userId: string, income: IncomeInput): Promise<string> => {
      const input = {
        userId,
        budgetId,
        name: income.name,
        amount: income.amount,
        date: income.date,
        sourceType: 'MANUAL' as const,
      };
      const resp = await request(CREATE_INCOME, {
        input,
      });
      return resp.createIncome.id;
    },
    [request, userId],
  );

  const patchIncome = useCallback(
    async (income: Income): Promise<string> => {
      const input = {
        id: income.id,
        name: income.name,
        amount: income.amount,
        date: income.date,
        sourceType: income.sourceType,
      };
      const resp = await request(UPDATE_INCOME, {
        input,
      });
      return resp.updateIncome.id;
    },
    [request],
  );

  const deleteIncome = useCallback(
    async (incomeId: string) => {
      await request(DELETE_INCOME, {
        id: incomeId,
      });
      return true;
    },
    [request],
  );

  return useMemo(
    () => ({ getIncomes, postIncome, patchIncome, deleteIncome }),
    [getIncomes, postIncome, patchIncome, deleteIncome],
  );
};

export default useIncomes;
