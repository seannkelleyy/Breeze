import { useMutation } from 'react-query';
import { useCallback } from 'react';
import {  useGoals } from './goalServices';

type DeleteGoalProps = {
    onSuccess?: () => void;
    onSettled?: () => void;
};

/**
 * A hook for deleting a goal.
 * @param props.onSuccess: - Optional - The function to call when the mutation is successful.
 * @param props.onSettled: - Optional - The function to call when the mutation is settled.
 */

type DeleteGoalMutationProps = {
  userId: string;
  goalId: number;
}
 
/**
 * Mutation function for deleting a Goal.
 * @param props.userId: The user id to delete the goal from.
 * @param props.goalId: The goal id to delete.
 */

export const useDeleteGoal = ({ onSuccess, onSettled}: DeleteGoalProps) => {
  const { deleteGoal } = useGoals();

  const mutationFn = useCallback(({userId, goalId}: DeleteGoalMutationProps) => deleteGoal(userId, goalId), [ deleteGoal]);

  return useMutation(mutationFn, {
    onSuccess: onSuccess,
    onSettled: onSettled,
  });
};