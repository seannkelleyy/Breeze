import { useQuery } from 'react-query'
import { useCallback } from 'react'
import { Expense, useExpenses } from './expenseServicess'
import { Category } from '../category/categoryServicess'

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
		return getExpenses(category)
	}, [getExpenses, category])

	return useQuery<Expense[], Error>(['expenses', category.id], fetchExpenses, {
		refetchInterval: 180 * 1000,
		refetchOnMount: 'always',
		retryDelay: 10 * 1000,
	})
}