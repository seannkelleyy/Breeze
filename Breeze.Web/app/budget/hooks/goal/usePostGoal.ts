import { useCallback } from 'react'

import { useMutation } from '@tanstack/react-query'
import { Goal } from '../../types/goal'
import { useGoals } from './index'

interface PostGoalProps {
	onSuccess?: () => void
	onSettled?: () => void
}

/**
 * A hook for posting a goal.
 * @param props.onSuccess: - Optional - The function to call when the mutation is successful.
 * @param props.onSettled: - Optional - The function to call when the mutation is settled.
 */

interface PostGoalMutationProps {
	goal: Goal
}

/**
 * Mutation function for posting a Goal.
 * @param props.userId: The user id to post the goal with.
 * @param props.goal: The goal to post.
 */

const usePostGoal = ({ onSuccess, onSettled }: PostGoalProps) => {
	const { postGoal } = useGoals()

	const mutationFn = useCallback(({ goal }: PostGoalMutationProps) => postGoal(goal), [postGoal])

	return useMutation({
		mutationFn,
		onSuccess: onSuccess,
		onSettled: onSettled,
	})
}

export default usePostGoal

