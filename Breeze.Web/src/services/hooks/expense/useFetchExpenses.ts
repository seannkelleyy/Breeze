import { useQuery } from 'react-query'
import { useCallback } from 'react'
import { Expense, useExpenses } from './ExpenseServices'
import { Category } from '../category/CategoryServices'

type FetchExpenseProps = {
	category: Category
}

export const useFetchExpenses = ({ category }: FetchExpenseProps) => {
	const { getExpenses } = useExpenses()

	const fetchExpenses = useCallback(() => {
		return getExpenses(category)
	}, [getExpenses, category])

	return useQuery<Expense[], Error>(['expenses', category.id], fetchExpenses, {
		refetchInterval: 180 * 1000,
		refetchOnMount: 'always',
		enabled: true,
		retryDelay: 30 * 1000,
	})
}