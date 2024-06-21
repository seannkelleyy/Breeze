import { useMutation } from 'react-query';
import { useCallback } from 'react';
import {  useGoals } from './GoalServices';

type DeleteGoalProps = {
    userId: string;
    goalId: number;
    onSuccess?: () => void;
    onSettled?: () => void;
};

export const useDeleteGoal = ({userId, goalId, onSuccess, onSettled}: DeleteGoalProps) => {
  const { deleteGoal } = useGoals();

  const mutationFn = useCallback(() => deleteGoal(userId, goalId), [userId, goalId, deleteGoal]);

  return useMutation(mutationFn, {
    onSuccess: onSuccess,
    onSettled: onSettled,
  });
};