import {
  GET_RECURRING_EXPENSES,
  CREATE_RECURRING_EXPENSE,
  UPDATE_RECURRING_EXPENSE,
  DELETE_RECURRING_EXPENSE,
} from '@/lib/services/queries/budget';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import useGraphql from '@/lib/services/useGraphql';
import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

export type ScheduleType = 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

export interface RecurringIncomeTemplate {
  id: string;
  userId: string;
  name: string;
  amount: string;
  recurrenceInterval: ScheduleType;
  paydayDayOfMonth?: number | null;
  startDate: string;
  endDate?: string | null;
  personId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringExpenseTemplate {
  id: string;
  userId: string;
  name: string;
  amount: string;
  recurrenceInterval: ScheduleType;
  paydayDayOfMonth?: number | null;
  startDate: string;
  endDate?: string | null;
  personId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export function getRecurringExpenseMonthlyAmount(
  template: Pick<RecurringExpenseTemplate, 'amount' | 'recurrenceInterval'>,
): number {
  const amount = Number(template.amount) || 0;
  switch (template.recurrenceInterval) {
    case 'WEEKLY':
      return (amount * 52) / 12;
    case 'BIWEEKLY':
      return (amount * 26) / 12;
    case 'QUARTERLY':
      return amount / 3;
    case 'YEARLY':
      return amount / 12;
    default:
      return amount;
  }
}

export function getRecurringExpensesMonthlyTotal(
  templates: Array<Pick<RecurringExpenseTemplate, 'amount' | 'recurrenceInterval'>>,
): number {
  return templates.reduce((sum, t) => sum + getRecurringExpenseMonthlyAmount(t), 0);
}

/**
 * Shared query for recurring expense templates. Cached by TanStack Query so
 * every consumer (Expenses tab, Future planner) reads the same data.
 */
export const useRecurringExpenseTemplates = () => {
  const { request: graphqlRequest } = useGraphql();
  const { userId } = useCurrentUser();

  return useQuery<RecurringExpenseTemplate[]>({
    queryKey: ['recurring-expense-templates', userId],
    queryFn: async () => {
      const response = await graphqlRequest<{ recurringExpenses: RecurringExpenseTemplate[] }>(
        GET_RECURRING_EXPENSES,
        { userId },
      );
      return response.recurringExpenses;
    },
    enabled: !!userId,
  });
};

export const useRecurringTemplates = () => {
  const { request: graphqlRequest } = useGraphql();
  const { userId } = useCurrentUser();

  const getRecurringIncomeTemplates = useCallback(async (): Promise<RecurringIncomeTemplate[]> => {
    const query = `
        query RecurringIncomes($userId: ID!) {
          recurringIncomes(userId: $userId) {
            id
            userId
            name
            amount
            recurrenceInterval
            paydayDayOfMonth
            startDate
            endDate
            personId
            createdAt
            updatedAt
          }
        }
      `;
    const response = await graphqlRequest<{ recurringIncomes: RecurringIncomeTemplate[] }>(query, {
      userId,
    });
    return response.recurringIncomes;
  }, [graphqlRequest, userId]);

  const postRecurringIncomeTemplate = useCallback(
    async (
      template: Omit<RecurringIncomeTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
    ): Promise<RecurringIncomeTemplate> => {
      const mutation = `
        mutation CreateRecurringIncome($input: CreateRecurringIncomeInput!) {
          createRecurringIncome(input: $input) {
            id
            userId
            name
            amount
            recurrenceInterval
            paydayDayOfMonth
            startDate
            endDate
            personId
            createdAt
            updatedAt
          }
        }
      `;
      const input = {
        userId,
        name: template.name,
        amount: template.amount,
        recurrenceInterval: template.recurrenceInterval,
        paydayDayOfMonth: template.paydayDayOfMonth,
        startDate: template.startDate,
        endDate: template.endDate,
      } as const;
      const response = await graphqlRequest<{ createRecurringIncome: RecurringIncomeTemplate }>(
        mutation,
        { input },
      );
      return response.createRecurringIncome;
    },
    [graphqlRequest, userId],
  );

  const patchRecurringIncomeTemplate = useCallback(
    async (template: RecurringIncomeTemplate): Promise<RecurringIncomeTemplate> => {
      const mutation = `
        mutation UpdateRecurringIncome($input: UpdateRecurringIncomeInput!) {
          updateRecurringIncome(input: $input) {
            id
            userId
            name
            amount
            recurrenceInterval
            paydayDayOfMonth
            startDate
            endDate
            personId
            createdAt
            updatedAt
          }
        }
      `;
      const input = {
        id: template.id,
        name: template.name,
        amount: template.amount,
        recurrenceInterval: template.recurrenceInterval,
        paydayDayOfMonth: template.paydayDayOfMonth,
        startDate: template.startDate,
        endDate: template.endDate,
      } as const;
      const response = await graphqlRequest<{ updateRecurringIncome: RecurringIncomeTemplate }>(
        mutation,
        { input },
      );
      return response.updateRecurringIncome;
    },
    [graphqlRequest],
  );

  const deleteRecurringIncomeTemplate = useCallback(
    async (id: string): Promise<void> => {
      const mutation = `
        mutation DeleteRecurringIncome($id: ID!) {
          deleteRecurringIncome(id: $id)
        }
      `;
      await graphqlRequest<{ deleteRecurringIncome: boolean }>(mutation, { id });
    },
    [graphqlRequest],
  );

  const getRecurringExpenseTemplates = useCallback(async (): Promise<
    RecurringExpenseTemplate[]
  > => {
    const response = await graphqlRequest<{ recurringExpenses: RecurringExpenseTemplate[] }>(
      GET_RECURRING_EXPENSES,
      { userId },
    );
    return response.recurringExpenses;
  }, [graphqlRequest, userId]);

  const postRecurringExpenseTemplate = useCallback(
    async (
      template: Omit<RecurringExpenseTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
    ): Promise<RecurringExpenseTemplate> => {
      const response = await graphqlRequest<{ createRecurringExpense: RecurringExpenseTemplate }>(
        CREATE_RECURRING_EXPENSE,
        {
          input: {
            userId,
            name: template.name,
            amount: template.amount,
            recurrenceInterval: template.recurrenceInterval,
            paydayDayOfMonth: template.paydayDayOfMonth,
            startDate: template.startDate,
            endDate: template.endDate,
          },
        },
      );
      return response.createRecurringExpense;
    },
    [graphqlRequest, userId],
  );

  const patchRecurringExpenseTemplate = useCallback(
    async (template: RecurringExpenseTemplate): Promise<RecurringExpenseTemplate> => {
      const response = await graphqlRequest<{ updateRecurringExpense: RecurringExpenseTemplate }>(
        UPDATE_RECURRING_EXPENSE,
        {
          input: {
            id: template.id,
            name: template.name,
            amount: template.amount,
            recurrenceInterval: template.recurrenceInterval,
            paydayDayOfMonth: template.paydayDayOfMonth,
            startDate: template.startDate,
            endDate: template.endDate,
          },
        },
      );
      return response.updateRecurringExpense;
    },
    [graphqlRequest],
  );

  const deleteRecurringExpenseTemplate = useCallback(
    async (id: string): Promise<void> => {
      await graphqlRequest<{ deleteRecurringExpense: boolean }>(DELETE_RECURRING_EXPENSE, { id });
    },
    [graphqlRequest],
  );

  return {
    getRecurringIncomeTemplates,
    postRecurringIncomeTemplate,
    patchRecurringIncomeTemplate,
    deleteRecurringIncomeTemplate,
    getRecurringExpenseTemplates,
    postRecurringExpenseTemplate,
    patchRecurringExpenseTemplate,
    deleteRecurringExpenseTemplate,
  };
};
