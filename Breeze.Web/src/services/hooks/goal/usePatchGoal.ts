import { useMutation } from 'react-query';
import { useCallback } from 'react';
import { Goal, useGoals } from './GoalServices';

type PatchGoalProps = {
    userId: string;
    goal: Goal;
    onSuccess?: () => void;
    onSettled?: () => void;
};

export const usePatchGoal = ({userId, goal, onSuccess, onSettled}: PatchGoalProps) => {
  const { patchGoal } = useGoals();

  const mutationFn = useCallback(() => patchGoal(userId, goal), [userId, goal, patchGoal]);

  return useMutation(mutationFn, {
    onSuccess: onSuccess,
    onSettled: onSettled,
  });
};