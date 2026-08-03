import { useCallback, useMemo } from 'react';

import {
  CREATE_EXPENSE,
  DELETE_EXPENSE,
  GET_EXPENSES_BY_BUDGET,
  UPDATE_EXPENSE,
} from '@/lib/services/queries/budget';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import useGraphql from '@/lib/services/useGraphql';
import { Expense } from '../../types/expense';

/**
 * A hook for fetching and mutating expenses via GraphQL.
 */
const useExpenses = () => {
  const { request } = useGraphql();
  const { userId } = useCurrentUser();

  const getExpensesForBudget = useCallback(
    async (budgetId: string): Promise<Expense[]> => {
      const resp = await request<{ expenses: Expense[] }>(GET_EXPENSES_BY_BUDGET, {
        budgetId,
      });
      return resp?.expenses ?? [];
    },
    [request],
  );

  const postExpense = useCallback(
    async (
      budgetId: string,
      _userId: string,
      expense: Omit<Expense, 'id' | 'userId' | 'budgetId' | 'createdAt' | 'updatedAt'>,
    ): Promise<string> => {
      const input = {
        userId,
        budgetId,
        amount: expense.amount,
        date: expense.date,
        description: expense.description,
        splits: expense.splits.map((split) => ({
          categoryId: split.categoryId,
          amount: split.amount,
          description: split.description,
        })),
      };
      const resp = await request<{ createExpense: Expense }>(CREATE_EXPENSE, {
        input,
      });
      return resp.createExpense.id;
    },
    [request, userId],
  );

  const patchExpense = useCallback(
    async (expense: Expense): Promise<string> => {
      const input = {
        id: expense.id,
        amount: expense.amount,
        date: expense.date,
        description: expense.description,
        splits: expense.splits.map((split) => ({
          categoryId: split.categoryId,
          amount: split.amount,
          description: split.description,
        })),
      };
      const resp = await request<{ updateExpense: Expense }>(UPDATE_EXPENSE, {
        input,
      });
      return resp.updateExpense.id;
    },
    [request],
  );

  const deleteExpense = useCallback(
    async (expenseId: string) => {
      await request<{ deleteExpense: boolean }>(DELETE_EXPENSE, {
        id: expenseId,
      });
      return true;
    },
    [request],
  );

  return useMemo(
    () => ({
      getExpensesForBudget,
      postExpense,
      patchExpense,
      deleteExpense,
    }),
    [deleteExpense, getExpensesForBudget, patchExpense, postExpense],
  );
};

export default useExpenses;
