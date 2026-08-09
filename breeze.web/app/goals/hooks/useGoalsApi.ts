import { useCallback } from 'react';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import useGraphql from '@/lib/services/useGraphql';
import {
  CREATE_FINANCIAL_ORDER_STEPS,
  CREATE_GOAL,
  DELETE_GOAL,
  GET_GOALS,
  UPDATE_GOAL,
} from '@/lib/services/queries/goals';
import { Goal } from '../types/goal';

const useGoalsApi = () => {
  const { request } = useGraphql();
  const { userId } = useCurrentUser();

  const getGoals = useCallback((): Promise<Goal[]> => {
    return request<{ goals: Goal[] }>(GET_GOALS, {
      userId,
    }).then((resp) => resp?.goals ?? []);
  }, [request, userId]);

  const createGoal = useCallback(
    async (input: Partial<Goal> & { description: string; priority: number }): Promise<Goal> => {
      const resp = await request<{ createGoal: Goal }, { input: Record<string, unknown> }>(
        CREATE_GOAL,
        {
          input: {
            userId,
            description: input.description,
            isCompleted: input.isCompleted ?? false,
            targetAmount: input.targetAmount ?? null,
            targetDate: input.targetDate ?? null,
            category: input.category ?? null,
            customCategory: input.customCategory ?? null,
            priority: input.priority,
            notes: input.notes ?? null,
            connectedAccountIds: input.connectedAccountIds ?? [],
            isFinancialOrderStep: input.isFinancialOrderStep ?? false,
            financialOrderStep: input.financialOrderStep ?? null,
          },
        },
      );
      return resp.createGoal;
    },
    [request, userId],
  );

  const updateGoal = useCallback(
    async (input: Partial<Goal> & { id: string; description: string; priority: number }): Promise<Goal> => {
      const resp = await request<{ updateGoal: Goal }, { input: Record<string, unknown> }>(
        UPDATE_GOAL,
        {
          input: {
            id: input.id,
            description: input.description,
            isCompleted: input.isCompleted ?? false,
            targetAmount: input.targetAmount ?? null,
            targetDate: input.targetDate ?? null,
            category: input.category ?? null,
            customCategory: input.customCategory ?? null,
            priority: input.priority,
            notes: input.notes ?? null,
            connectedAccountIds: input.connectedAccountIds ?? [],
            isFinancialOrderStep: input.isFinancialOrderStep ?? false,
            financialOrderStep: input.financialOrderStep ?? null,
          },
        },
      );
      return resp.updateGoal;
    },
    [request],
  );

  const deleteGoal = useCallback(
    async (id: string): Promise<boolean> => {
      const resp = await request<{ deleteGoal: boolean }>(DELETE_GOAL, { id });
      return resp.deleteGoal;
    },
    [request],
  );

  const createFinancialOrderSteps = useCallback((): Promise<Goal[]> => {
    return request<{ createFinancialOrderSteps: Goal[] }>(CREATE_FINANCIAL_ORDER_STEPS).then(
      (resp) => resp?.createFinancialOrderSteps ?? [],
    );
  }, [request]);

  return { getGoals, createGoal, updateGoal, deleteGoal, createFinancialOrderSteps };
};

export default useGoalsApi;