import { useCallback, useMemo } from 'react';

import {
  CREATE_EXPENSE,
  DELETE_EXPENSE,
  GET_EXPENSES_BY_BUDGET,
  UPDATE_EXPENSE,
} from '@/lib/services/queries/budget';
import useGraphql from '@/lib/services/useGraphql';
import { Category } from '../../types/category';
import { Expense } from '../../types/expense';

/**
 * A hook for fetching and mutating expenses via GraphQL.
 */
const useExpenses = () => {
  const { request } = useGraphql();

  const getExpensesForCategory = useCallback(
    async (category: Category): Promise<Expense[]> => {
      const resp = await request<{ expenses: Expense[] }>(GET_EXPENSES_BY_BUDGET, {
        budgetId: category.budgetId,
      } as unknown as Record<string, unknown>);
      const all = resp?.expenses ?? [];
      return all.filter((e) => e.categoryId === category.id);
    },
    [request],
  );

  const getExpensesForBudget = useCallback(
    async (budgetId: number): Promise<Expense[]> => {
      const resp = await request<{ expenses: Expense[] }>(GET_EXPENSES_BY_BUDGET, {
        budgetId,
      } as unknown as Record<string, unknown>);
      return resp?.expenses ?? [];
    },
    [request],
  );

  const postExpense = useCallback(
    async (budgetId: number, expense: Expense): Promise<number> => {
      const input = {
        userId: expense.userId,
        budgetId,
        amount: String(expense.amount ?? '0'),
        date: expense.date,
        description: expense.notes ?? '',
        splits: [],
      };
      const resp = await request<{ createExpense: { id: number } }>(CREATE_EXPENSE, {
        input,
      } as unknown as Record<string, unknown>);
      return resp.createExpense.id;
    },
    [request],
  );

  const patchExpense = useCallback(
    async (budgetId: number, expense: Expense): Promise<number> => {
      const input = {
        id: expense.id,
        amount: String(expense.amount ?? '0'),
        date: expense.date,
        description: expense.notes ?? '',
        splits: [],
      };
      const resp = await request<{ updateExpense: { id: number } }>(UPDATE_EXPENSE, {
        input,
      } as unknown as Record<string, unknown>);
      return resp.updateExpense.id;
    },
    [request],
  );

  const deleteExpense = useCallback(
    async (budgetId: number, expense: Expense) => {
      await request<{ deleteExpense: boolean }>(DELETE_EXPENSE, {
        id: expense.id,
      } as unknown as Record<string, unknown>);
      return true;
    },
    [request],
  );

  return useMemo(
    () => ({
      getExpensesForCategory,
      getExpensesForBudget,
      postExpense,
      patchExpense,
      deleteExpense,
    }),
    [deleteExpense, getExpensesForBudget, getExpensesForCategory, patchExpense, postExpense],
  );
};

export default useExpenses;
