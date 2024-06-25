import { useMutation } from 'react-query';
import { useCallback } from 'react';
import {  useGoals } from './goalServices';

type DeleteGoalProps = {
    userId: string;
    goalId: number;
    onSuccess?: () => void;
    onSettled?: () => void;
};

/**
 * A hook for deleting a goal.
 * @param props.userId: The user id to delete the goal from.
 * @param props.goalId: The goal id to delete.
 * @param props.onSuccess: - Optional - The function to call when the mutation is successful.
 * @param props.onSettled: - Optional - The function to call when the mutation is settled.
 */
export const useDeleteGoal = ({userId, goalId, onSuccess, onSettled}: DeleteGoalProps) => {
  const { deleteGoal } = useGoals();

  const mutationFn = useCallback(() => deleteGoal(userId, goalId), [userId, goalId, deleteGoal]);

  return useMutation(mutationFn, {
    onSuccess: onSuccess,
    onSettled: onSettled,
  });
};