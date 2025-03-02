import { useMutation } from 'react-query';
import { useCallback } from 'react';
import { Goal, useGoals } from './goalServices';

type PostGoalProps = {
    onSuccess?: () => void;
    onSettled?: () => void;
};

/**
* A hook for posting a goal.
* @param props.onSuccess: - Optional - The function to call when the mutation is successful.
* @param props.onSettled: - Optional - The function to call when the mutation is settled.
*/

type PostGoalMutationProps = {
  userId: string;
  goal: Goal;
}
 
/**
 * Mutation function for posting a Goal.
 * @param props.userId: The user id to post the goal with.
 * @param props.goal: The goal to post.
 */

export const usePostGoal = ({onSuccess, onSettled}: PostGoalProps) => {
  const { postGoal } = useGoals();

  const mutationFn = useCallback(({userId, goal} : PostGoalMutationProps) => postGoal(userId, goal), [postGoal]);

  return useMutation(mutationFn, {
    onSuccess: onSuccess,
    onSettled: onSettled,
  });
};