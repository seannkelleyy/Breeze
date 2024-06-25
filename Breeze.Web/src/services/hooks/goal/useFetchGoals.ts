import { useQuery } from 'react-query'
import { useCallback } from 'react'
import { Goal, useGoals } from './goalServicess'

type FetchGoalProps = {
	userId: string
}


/**
 * A hook for fetching goal data.
 * @param props.userId: The user id to fetch goals from.
 */
export const useFetchGoals = ({ userId }: FetchGoalProps) => {
	const { getGoals } = useGoals()

	const fetchGoals = useCallback(() => {
		return getGoals(userId)
	}, [getGoals, userId])

	return useQuery<Goal[], Error>(['goals', userId], fetchGoals, {
		refetchInterval: 180 * 1000,
		refetchOnMount: 'always',
		retryDelay: 10 * 1000,
	})
}