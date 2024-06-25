import { useMutation } from 'react-query';
import { useCallback } from 'react';
import { Goal, useGoals } from './goalServicess';

type PostGoalProps = {
    userId: string;
    goal: Goal;
    onSuccess?: () => void;
    onSettled?: () => void;
};

/**
* A hook for posting a goal.
* @param props.userId: The user id to post the goal to.
* @param props.goal: The goal to post.
* @param props.onSuccess: - Optional - The function to call when the mutation is successful.
* @param props.onSettled: - Optional - The function to call when the mutation is settled.
*/
export const usePostGoal = ({userId, goal, onSuccess, onSettled}: PostGoalProps) => {
  const { postGoal } = useGoals();

  const mutationFn = useCallback(() => postGoal(userId, goal), [userId, goal, postGoal]);

  return useMutation(mutationFn, {
    onSuccess: onSuccess,
    onSettled: onSettled,
  });
};