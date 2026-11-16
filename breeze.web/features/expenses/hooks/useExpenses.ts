import { useCallback, useMemo } from 'react';

import {
  CREATE_EXPENSE,
  DELETE_EXPENSE,
  UPDATE_EXPENSE,
} from '@/features/expenses/expense.mutations';
import { GET_EXPENSES_BY_BUDGET } from '@/features/expenses/expense.queries';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import useGraphql from '@/lib/services/useGraphql';
import { Expense, ExpenseInput } from '@/features/expenses/types';

/**
 * A hook for fetching and mutating expenses via GraphQL.
 */
const useExpenses = () => {
  const { request } = useGraphql();
  const { userId } = useCurrentUser();

  const getExpensesForBudget = useCallback(
    async (budgetId: string): Promise<Expense[]> => {
      const resp = await request(GET_EXPENSES_BY_BUDGET, {
        budgetId,
      });
      return resp?.expenses ?? [];
    },
    [request],
  );

  const postExpense = useCallback(
    async (budgetId: string, _userId: string, expense: ExpenseInput): Promise<string> => {
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
      const resp = await request(CREATE_EXPENSE, {
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
      const resp = await request(UPDATE_EXPENSE, {
        input,
      });
      return resp.updateExpense.id;
    },
    [request],
  );

  const deleteExpense = useCallback(
    async (expenseId: string) => {
      await request(DELETE_EXPENSE, {
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
