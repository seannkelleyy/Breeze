import { useQuery } from 'react-query'
import { useCallback } from 'react'
import { Category, useCategories } from './categoryServices'

type FetchCategoryProps = {
	budgetId: number
}

/**
 * A hook for fetching category data. This should only be used when creating new hooks with ReactQuery.
 * @param budgetId. The Id of the budget to fetch categories for.
 */
export const useFetchCategories = ({ budgetId }: FetchCategoryProps) => {
	const { getCategories } = useCategories()

	const fetchCategories = useCallback(() => {
		return getCategories(budgetId)
	}, [getCategories, budgetId])

	return useQuery<Category[], Error>(['categories', budgetId], fetchCategories, {
		refetchInterval: 180 * 1000,
		retryDelay: 10 * 1000,
	})
}