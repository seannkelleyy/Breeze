import { useCallback } from 'react';

import { useMutation } from '@tanstack/react-query';
import { Goal } from '../../types/goal';
import { useGoals } from './index';

interface PatchGoalProps {
  onSuccess?: () => void;
  onSettled?: () => void;
}

/**
 * A hook for patching a goal.
 * @param props.onSuccess: - Optional - The function to call when the mutation is successful.
 * @param props.onSettled: - Optional - The function to call when the mutation is settled.
 */

interface PatchGoalMutationProps {
  goal: Goal;
}

/**
 * Mutation function for patching a Goal.
 * @param props.userId: The user id to patch the goal with.
 * @param props.goal: The goal to patch.
 */

const usePatchGoal = ({ onSuccess, onSettled }: PatchGoalProps) => {
  const { patchGoal } = useGoals();

  const mutationFn = useCallback(
    ({ goal }: PatchGoalMutationProps) => patchGoal(goal),
    [patchGoal],
  );

  return useMutation({
    mutationFn,
    onSuccess: onSuccess,
    onSettled: onSettled,
  });
};

export default usePatchGoal;
