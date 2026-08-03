import { useCallback } from 'react';

import { useMutation } from '@tanstack/react-query';
import { Goal } from '../../types/goal';
import { useGoals } from './index';

interface DeleteGoalProps {
  onSuccess?: () => void;
  onSettled?: () => void;
}

/**
 * A hook for deleting a goal.
 * @param props.onSuccess: - Optional - The function to call when the mutation is successful.
 * @param props.onSettled: - Optional - The function to call when the mutation is settled.
 */

interface DeleteGoalMutationProps {
  goal: Goal;
}

/**
 * Mutation function for deleting a Goal.
 * @param props.userId: The user id to delete the goal from.
 * @param props.goalId: The goal id to delete.
 */

const useDeleteGoal = ({ onSuccess, onSettled }: DeleteGoalProps) => {
  const { deleteGoal } = useGoals();

  const mutationFn = useCallback(
    ({ goal }: DeleteGoalMutationProps) => deleteGoal(goal),
    [deleteGoal],
  );

  return useMutation({
    mutationFn,
    onSuccess: onSuccess,
    onSettled: onSettled,
  });
};

export default useDeleteGoal;
