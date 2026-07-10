import {
  GET_CATEGORIES,
  CREATE_EXPENSE_CATEGORY,
  UPDATE_EXPENSE_CATEGORY,
  DELETE_EXPENSE_CATEGORY,
} from '@/lib/services/queries/budget';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import useGraphql from '@/lib/services/useGraphql';
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
  createdAt: string;
  updatedAt: string;
}

export interface RecurringCategoryTemplate {
  id?: string;
  userId?: string;
  name: string;
  allocation: number;
  startDate: string;
  stopDate?: string | null;
  isActive: boolean;
}

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
      };
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
      };
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

  const getRecurringCategoryTemplates = useCallback(
    async (budgetId: string, budgetMonth?: string): Promise<RecurringCategoryTemplate[]> => {
      const response = await graphqlRequest<{
        expenseCategories: Array<{
          id: string;
          name: string;
          allocation: string;
        }>;
      }>(GET_CATEGORIES, { budgetId } as Record<string, unknown>);
      const defaultStart = budgetMonth ?? `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`;
      return (response?.expenseCategories ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        allocation: Number(c.allocation),
        startDate: defaultStart,
        stopDate: null,
        isActive: true,
      }));
    },
    [graphqlRequest],
  );

  const postRecurringCategoryTemplate = useCallback(
    async (
      template: RecurringCategoryTemplate,
      budgetId: string,
    ): Promise<RecurringCategoryTemplate> => {
      const response = await graphqlRequest<{
        createExpenseCategory: { id: string; name: string; allocation: string };
      }>(CREATE_EXPENSE_CATEGORY, {
        input: {
          userId,
          budgetId,
          name: template.name,
          allocation: template.allocation.toString(),
          currentSpend: '0',
        },
      });
      return {
        ...template,
        id: response.createExpenseCategory.id,
      };
    },
    [graphqlRequest, userId],
  );

  const patchRecurringCategoryTemplate = useCallback(
    async (
      template: RecurringCategoryTemplate,
    ): Promise<RecurringCategoryTemplate> => {
      if (!template.id) throw new Error('Cannot update a category without an ID');
      await graphqlRequest(UPDATE_EXPENSE_CATEGORY, {
        input: {
          id: template.id,
          name: template.name,
          allocation: template.allocation.toString(),
          currentSpend: '0',
        },
      });
      return template;
    },
    [graphqlRequest],
  );

  const deleteRecurringCategoryTemplate = useCallback(async (id: string): Promise<void> => {
    await graphqlRequest(DELETE_EXPENSE_CATEGORY, { id });
  }, [graphqlRequest]);

  return {
    getRecurringIncomeTemplates,
    postRecurringIncomeTemplate,
    patchRecurringIncomeTemplate,
    deleteRecurringIncomeTemplate,
    getRecurringCategoryTemplates,
    postRecurringCategoryTemplate,
    patchRecurringCategoryTemplate,
    deleteRecurringCategoryTemplate,
  };
};
