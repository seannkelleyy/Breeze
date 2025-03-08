import { useQuery } from 'react-query'
import { useCallback } from 'react'
import { Expense, useExpenses } from './expenseServices'
import { Category } from '../category/categoryServices'

type FetchExpensesForCategoryProps = {
	category: Category
}

/**
 * A hook for fetching expenses.
 * @param props.category: The category to fetch expenses from.
 */
export const useFetchExpensesForCategory = ({ category }: FetchExpensesForCategoryProps) => {
	const { getExpensesForCategory } = useExpenses()

	const fetchExpenses = useCallback(() => {
		if (!category) return []
		return getExpensesForCategory(category)
	}, [getExpensesForCategory, category])

	return useQuery<Expense[], Error>(['expensesCategory', category], fetchExpenses, {
		refetchInterval: 180 * 1000,
		retryDelay: 10 * 1000,
	})
}

