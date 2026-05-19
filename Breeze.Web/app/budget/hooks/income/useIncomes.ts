import { useCallback, useMemo } from 'react';

import {
  CREATE_INCOME,
  DELETE_INCOME,
  GET_INCOMES_BY_BUDGET,
  UPDATE_INCOME,
} from '@/lib/services/queries/budget';
import useGraphql from '@/lib/services/useGraphql';
import { Income } from '../../types/income';

/**
 * A hook for fetching and mutating incomes via GraphQL.
 */
const useIncomes = () => {
  const { request } = useGraphql();

  const getIncomes = useCallback(
    async (budgetId: string): Promise<Income[]> => {
      const resp = await request<{ incomes: Income[] }>(GET_INCOMES_BY_BUDGET, {
        budgetId,
      });
      return resp?.incomes ?? [];
    },
    [request],
  );

  const postIncome = useCallback(
    async (
      budgetId: string,
      userId: string,
      income: Omit<Income, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'sourceType'>,
    ): Promise<string> => {
      const input = {
        userId,
        budgetId,
        name: income.name,
        amount: income.amount,
        date: income.date,
        sourceType: 'MANUAL',
      };
      const resp = await request<{ createIncome: Income }>(CREATE_INCOME, {
        input,
      });
      return resp.createIncome.id;
    },
    [request],
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
      const resp = await request<{ updateIncome: Income }>(UPDATE_INCOME, {
        input,
      });
      return resp.updateIncome.id;
    },
    [request],
  );

  const deleteIncome = useCallback(
    async (incomeId: string) => {
      await request<{ deleteIncome: boolean }>(DELETE_INCOME, {
        id: incomeId,
      });
      return true;
    },
    [request],
  );

  return useMemo(
    () => ({ getIncomes, postIncome, patchIncome, deleteIncome }),
    [deleteIncome, getIncomes, patchIncome, postIncome],
  );
};

export default useIncomes;
