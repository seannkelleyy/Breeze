import { useMutation } from 'react-query';
import { useCallback } from 'react';
import { Goal, useGoals } from './GoalServices';

type PostGoalProps = {
    userId: string;
    goal: Goal;
    onSuccess?: () => void;
    onSettled?: () => void;
};

export const usePostGoal = ({userId, goal, onSuccess, onSettled}: PostGoalProps) => {
  const { postGoal } = useGoals();

  const mutationFn = useCallback(() => postGoal(userId, goal), [userId, goal, postGoal]);

  return useMutation(mutationFn, {
    onSuccess: onSuccess,
    onSettled: onSettled,
  });
};