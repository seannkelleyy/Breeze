import useHttp from '@/lib/services/useHttp';
import { Goal } from '../../types/goal';

/**
 * A hook for fetching goal data. This should only be used when creating new hooks with ReactQuery.
 */
const useGoals = () => {
  const { getMany, post, patch, deleteOne } = useHttp();

  const getGoals = async (userId: string): Promise<Goal[]> =>
    await getMany<Goal>(`users/${userId}/goals`);

  const postGoal = async (goal: Goal): Promise<number> =>
    post<number, Goal>(`users/${goal.userId}/goals`, goal);

  const patchGoal = async (goal: Goal): Promise<number> =>
    patch<number, Goal>(`users/${goal.userId}/goals`, goal);

  const deleteGoal = async (goal: Goal) => deleteOne<Goal>(`users/${goal.userId}/goals/${goal.id}`);

  return { getGoals, postGoal, patchGoal, deleteGoal };
};

export default useGoals;
