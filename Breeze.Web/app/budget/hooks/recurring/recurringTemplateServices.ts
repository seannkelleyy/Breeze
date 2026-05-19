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
    if (!userId) return [];
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
      if (!userId) throw new Error('User not authenticated');
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

  const getRecurringCategoryTemplates = useCallback(async (): Promise<
    RecurringCategoryTemplate[]
  > => {
    // Placeholder - Category templates not yet in GraphQL schema
    return [];
  }, []);

  const postRecurringCategoryTemplate = useCallback(
    async (_template: RecurringCategoryTemplate): Promise<RecurringCategoryTemplate> => {
      // Placeholder - Category templates not yet in GraphQL schema
      throw new Error('Recurring category templates not yet implemented');
    },
    [],
  );

  const patchRecurringCategoryTemplate = useCallback(
    async (_template: RecurringCategoryTemplate): Promise<RecurringCategoryTemplate> => {
      // Placeholder - Category templates not yet in GraphQL schema
      throw new Error('Recurring category templates not yet implemented');
    },
    [],
  );

  const deleteRecurringCategoryTemplate = useCallback(async (_id: string): Promise<void> => {
    // Placeholder - Category templates not yet in GraphQL schema
    throw new Error('Recurring category templates not yet implemented');
  }, []);

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
