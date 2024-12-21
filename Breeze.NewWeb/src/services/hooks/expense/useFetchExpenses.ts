import { useQuery } from 'react-query'
import { useCallback } from 'react'
import { Expense, useExpenses } from './expenseServices'
import { Category } from '../category/categoryServices'

type FetchExpenseProps = {
	category: Category
}

/**
 * A hook for fetching expenses.
 * @param props.category: The category to fetch expenses from.
 */
export const useFetchExpenses = ({ category }: FetchExpenseProps) => {
	const { getExpenses } = useExpenses()

	const fetchExpenses = useCallback(() => {
		if (!category.id)
			return []
		return getExpenses(category)
	}, [getExpenses, category])

	return useQuery<Expense[], Error>(['expenses', category], fetchExpenses, {
		refetchInterval: 180 * 1000,
		retryDelay: 10 * 1000,
	})
}