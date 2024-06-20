import { useQuery } from 'react-query'
import { useCallback } from 'react'
import { Category, useCategories } from './CategoryServices'

type FetchCategoryProps = {
	budgetId: number
}

export const useFetchCategories = ({ budgetId }: FetchCategoryProps) => {
	const { getCategories } = useCategories()

	const fetchCategories = useCallback(() => {
		return getCategories(budgetId)
	}, [getCategories, budgetId])

	return useQuery<Category[], Error>(['categories', budgetId], fetchCategories, {
		refetchInterval: 180 * 1000,
		refetchOnMount: 'always',
		retryDelay: 10 * 1000,
	})
}