import {
  CREATE_EXPENSE,
  DELETE_EXPENSE,
  UPDATE_EXPENSE,
} from '@/features/expenses/expense.mutations';
import { GET_EXPENSES_BY_BUDGET } from '@/features/expenses/expense.queries';

import useGraphql from '@/lib/services/useGraphql';
import { Expense, ExpenseInput } from '@/features/expenses/types';

/**
 * A hook for fetching and mutating expenses via GraphQL.
 */
const useExpenses = () => {
  const { request } = useGraphql();

  const getExpensesForBudget = async (budgetId: string): Promise<Expense[]> => {
    const resp = await request(GET_EXPENSES_BY_BUDGET, {
      budgetId,
    });
    return resp?.expenses ?? [];
  };

  const postExpense = async (budgetId: string, expense: ExpenseInput): Promise<string> => {
    const input = {
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
  };

  const patchExpense = async (expense: Expense): Promise<string> => {
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
  };

  const deleteExpense = async (expenseId: string) => {
    await request(DELETE_EXPENSE, {
      id: expenseId,
    });
    return true;
  };

  return {
    getExpensesForBudget,
    postExpense,
    patchExpense,
    deleteExpense,
  };
};

export default useExpenses;
