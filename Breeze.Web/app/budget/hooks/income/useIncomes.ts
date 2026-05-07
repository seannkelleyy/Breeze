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
    async (budgetId: number): Promise<Income[]> => {
      const resp = await request<{ incomes: Income[] }>(GET_INCOMES_BY_BUDGET, {
        budgetId,
      } as unknown as Record<string, unknown>);
      return resp?.incomes ?? [];
    },
    [request],
  );

  const postIncome = useCallback(
    async (budgetId: number, income: Income): Promise<number> => {
      const input = {
        userId: income.userId,
        budgetId,
        name: income.name,
        amount: String(income.amount ?? '0'),
        date: income.date,
        sourceType: 'MANUAL',
      };
      const resp = await request<{ createIncome: { id: number } }>(CREATE_INCOME, {
        input,
      } as unknown as Record<string, unknown>);
      return resp.createIncome.id;
    },
    [request],
  );

  const patchIncome = useCallback(
    async (income: Income): Promise<number> => {
      const input = {
        id: income.id,
        name: income.name,
        amount: String(income.amount ?? '0'),
        date: income.date,
        sourceType: 'MANUAL',
      };
      const resp = await request<{ updateIncome: { id: number } }>(UPDATE_INCOME, {
        input,
      } as unknown as Record<string, unknown>);
      return resp.updateIncome.id;
    },
    [request],
  );

  const deleteIncome = useCallback(
    async (income: Income) => {
      await request<{ deleteIncome: boolean }>(DELETE_INCOME, {
        id: income.id,
      } as unknown as Record<string, unknown>);
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
