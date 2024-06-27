import { useQuery } from 'react-query'
import { useCallback } from 'react'
import { Category, useCategories } from './categoryServices'

type FetchCategoryProps = {
	budgetId: number
	enabled?: boolean
}

/**
 * A hook for fetching category data. This should only be used when creating new hooks with ReactQuery.
 * @param budgetId. The Id of the budget to fetch categories for.
 * @param enabled. - optional - Determines whether or not the request is made.
 */
export const useFetchCategories = ({ budgetId, enabled }: FetchCategoryProps) => {
	const { getCategories } = useCategories()

	const fetchCategories = useCallback(() => {
		if (!enabled) {
			return []
		}
		return getCategories(budgetId)
	}, [getCategories, budgetId, enabled])

	return useQuery<Category[], Error>(['categories', budgetId], fetchCategories, {
		refetchInterval: 180 * 1000,
		retryDelay: 10 * 1000,
		enabled: enabled
	})
}