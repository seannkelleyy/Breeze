import {
  GET_RECURRING_EXPENSES,
  CREATE_RECURRING_EXPENSE,
  UPDATE_RECURRING_EXPENSE,
  DELETE_RECURRING_EXPENSE,
  GET_RECURRING_INCOMES,
  CREATE_RECURRING_INCOME,
  UPDATE_RECURRING_INCOME,
  DELETE_RECURRING_INCOME,
} from '@/features/recurring/recurring.operations';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import useGraphql from '@/lib/services/useGraphql';
import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

export type ScheduleType = import('@/lib/gql/graphql').RecurrenceInterval;

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

function getRecurringExpenseMonthlyAmount(
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
      const response = await graphqlRequest(GET_RECURRING_EXPENSES, { userId });
      return response.recurringExpenses;
    },
    enabled: !!userId,
  });
};

export const useRecurringTemplates = () => {
  const { request: graphqlRequest } = useGraphql();
  const { userId } = useCurrentUser();

  const getRecurringIncomeTemplates = async (): Promise<RecurringIncomeTemplate[]> => {
    const response = await graphqlRequest(GET_RECURRING_INCOMES, {
      userId,
    });
    return response.recurringIncomes;
  };

  const postRecurringIncomeTemplate = async (
    template: Omit<RecurringIncomeTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
  ): Promise<RecurringIncomeTemplate> => {
    const input = {
      userId,
      name: template.name,
      amount: template.amount,
      recurrenceInterval: template.recurrenceInterval,
      paydayDayOfMonth: template.paydayDayOfMonth,
      startDate: template.startDate,
      endDate: template.endDate,
    } as const;
    const response = await graphqlRequest(CREATE_RECURRING_INCOME, { input });
    return response.createRecurringIncome;
  };

  const patchRecurringIncomeTemplate = async (
    template: RecurringIncomeTemplate,
  ): Promise<RecurringIncomeTemplate> => {
    const input = {
      id: template.id,
      name: template.name,
      amount: template.amount,
      recurrenceInterval: template.recurrenceInterval,
      paydayDayOfMonth: template.paydayDayOfMonth,
      startDate: template.startDate,
      endDate: template.endDate,
    } as const;
    const response = await graphqlRequest(UPDATE_RECURRING_INCOME, { input });
    return response.updateRecurringIncome;
  };

  const deleteRecurringIncomeTemplate = async (id: string): Promise<void> => {
    await graphqlRequest(DELETE_RECURRING_INCOME, { id });
  };

  // Kept memoized: it is a dependency of the mount effect in
  // useRecurringExpenseManager, so a new identity per render would refetch.
  const getRecurringExpenseTemplates = useCallback(async (): Promise<
    RecurringExpenseTemplate[]
  > => {
    const response = await graphqlRequest(GET_RECURRING_EXPENSES, { userId });
    return response.recurringExpenses;
  }, [graphqlRequest, userId]);

  const postRecurringExpenseTemplate = async (
    template: Omit<RecurringExpenseTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
  ): Promise<RecurringExpenseTemplate> => {
    const response = await graphqlRequest(CREATE_RECURRING_EXPENSE, {
      input: {
        userId,
        name: template.name,
        amount: template.amount,
        recurrenceInterval: template.recurrenceInterval,
        paydayDayOfMonth: template.paydayDayOfMonth,
        startDate: template.startDate,
        endDate: template.endDate,
      },
    });
    return response.createRecurringExpense;
  };

  const patchRecurringExpenseTemplate = async (
    template: RecurringExpenseTemplate,
  ): Promise<RecurringExpenseTemplate> => {
    const response = await graphqlRequest(UPDATE_RECURRING_EXPENSE, {
      input: {
        id: template.id,
        name: template.name,
        amount: template.amount,
        recurrenceInterval: template.recurrenceInterval,
        paydayDayOfMonth: template.paydayDayOfMonth,
        startDate: template.startDate,
        endDate: template.endDate,
      },
    });
    return response.updateRecurringExpense;
  };

  const deleteRecurringExpenseTemplate = async (id: string): Promise<void> => {
    await graphqlRequest(DELETE_RECURRING_EXPENSE, { id });
  };

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
