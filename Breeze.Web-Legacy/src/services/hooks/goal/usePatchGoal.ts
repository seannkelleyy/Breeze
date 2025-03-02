import { useMutation } from 'react-query';
import { useCallback } from 'react';
import { Goal, useGoals } from './goalServices';

type PatchGoalProps = {
    onSuccess?: () => void;
    onSettled?: () => void;
};

/**
* A hook for patching a goal.
* @param props.onSuccess: - Optional - The function to call when the mutation is successful.
* @param props.onSettled: - Optional - The function to call when the mutation is settled.
*/

type PatchGoalMutationProps = {
  userId: string;
  goal: Goal;
}
 
/**
 * Mutation function for patching a Goal.
 * @param props.userId: The user id to patch the goal with.
 * @param props.goal: The goal to patch.
 */
 
export const usePatchGoal = ({onSuccess, onSettled}: PatchGoalProps) => {
  const { patchGoal } = useGoals();

  const mutationFn = useCallback(({userId, goal}: PatchGoalMutationProps) => patchGoal(userId, goal), [patchGoal]);

  return useMutation(mutationFn, {
    onSuccess: onSuccess,
    onSettled: onSettled,
  });
};