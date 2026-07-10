import { CREATE_GOAL, DELETE_GOAL, GET_GOALS, UPDATE_GOAL } from '@/lib/services/queries/budget';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import useGraphql from '@/lib/services/useGraphql';
import { useCallback } from 'react';
import { Goal } from '../../types/goal';

/**
 * A hook for fetching goal data via GraphQL. This should only be used when creating new hooks with ReactQuery.
 */
const useGoals = () => {
  const { request } = useGraphql();
  const { userId } = useCurrentUser();

  const getGoals = useCallback(
    async (): Promise<Goal[]> => {
      const resp = await request<{ goals: Goal[] }>(GET_GOALS, { userId } as unknown as Record<
        string,
        unknown
      >);
      return resp?.goals ?? [];
    },
    [request, userId],
  );

  const postGoal = useCallback(
    async (goal: Goal): Promise<string> => {
      const input = {
        userId,
        description: goal.description,
        isCompleted: goal.isCompleted ?? false,
      };
      const resp = await request<{ createGoal: { id: string } }>(CREATE_GOAL, {
        input,
      } as unknown as Record<string, unknown>);
      return resp.createGoal.id;
    },
    [request, userId],
  );

  const patchGoal = useCallback(
    async (goal: Goal): Promise<string> => {
      const input = {
        id: goal.id,
        description: goal.description,
        isCompleted: goal.isCompleted,
      };
      const resp = await request<{ updateGoal: { id: string } }>(UPDATE_GOAL, {
        input,
      } as unknown as Record<string, unknown>);
      return resp.updateGoal.id;
    },
    [request],
  );

  const deleteGoal = useCallback(
    async (goal: Goal) => {
      await request<{ deleteGoal: boolean }>(DELETE_GOAL, { id: goal.id } as unknown as Record<
        string,
        unknown
      >);
    },
    [request],
  );

  return { getGoals, postGoal, patchGoal, deleteGoal };
};

export default useGoals;
