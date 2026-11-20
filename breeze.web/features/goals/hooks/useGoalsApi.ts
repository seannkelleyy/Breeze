import useGraphql from '@/lib/services/useGraphql';
import {
  CREATE_FINANCIAL_ORDER_STEPS,
  CREATE_GOAL,
  DELETE_GOAL,
  GET_GOALS,
  UPDATE_GOAL,
} from '@/features/goals/goal.operations';
import { Goal } from '../types';

const useGoalsApi = () => {
  const { request } = useGraphql();

  const getGoals = (): Promise<Goal[]> => {
    return request(GET_GOALS).then((resp) => resp?.goals ?? []);
  };

  const createGoal = async (
    input: Partial<Goal> & { description: string; priority: number },
  ): Promise<Goal> => {
    const resp = await request(CREATE_GOAL, {
      input: {
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
    });
    return resp.createGoal;
  };

  const updateGoal = async (
    input: Partial<Goal> & { id: string; description: string; priority: number },
  ): Promise<Goal> => {
    const resp = await request(UPDATE_GOAL, {
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
    });
    return resp.updateGoal;
  };

  const deleteGoal = async (id: string): Promise<boolean> => {
    const resp = await request(DELETE_GOAL, { id });
    return resp.deleteGoal;
  };

  const createFinancialOrderSteps = (): Promise<Goal[]> => {
    return request(CREATE_FINANCIAL_ORDER_STEPS).then(
      (resp) => resp?.createFinancialOrderSteps ?? [],
    );
  };

  return { getGoals, createGoal, updateGoal, deleteGoal, createFinancialOrderSteps };
};

export default useGoalsApi;
