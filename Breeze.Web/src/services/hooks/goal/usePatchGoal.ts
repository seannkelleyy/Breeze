import { useMutation } from 'react-query';
import { useCallback } from 'react';
import { Goal, useGoals } from './goalServicess';

type PatchGoalProps = {
    userId: string;
    goal: Goal;
    onSuccess?: () => void;
    onSettled?: () => void;
};

/**
* A hook for patching a goal.
* @param props.userId: The user id to patch the goal to.
* @param props.goal: The goal to patch.
* @param props.onSuccess: - Optional - The function to call when the mutation is successful.
* @param props.onSettled: - Optional - The function to call when the mutation is settled.
*/
export const usePatchGoal = ({userId, goal, onSuccess, onSettled}: PatchGoalProps) => {
  const { patchGoal } = useGoals();

  const mutationFn = useCallback(() => patchGoal(userId, goal), [userId, goal, patchGoal]);

  return useMutation(mutationFn, {
    onSuccess: onSuccess,
    onSettled: onSettled,
  });
};