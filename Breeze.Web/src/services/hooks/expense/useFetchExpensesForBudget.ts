import { useQuery } from 'react-query'
import { useCallback } from 'react'
import { Expense, useExpenses } from './expenseServices'

type FetchExpensesForBudgetProps = {
	budgetId: number
}

/**
 * A hook for fetching expenses.
 * @param props.budget: The category to fetch expenses from.
 */
export const useFetchExpensesForBudget = ({ budgetId }: FetchExpensesForBudgetProps) => {
	const { getExpensesForBudget } = useExpenses()

	const fetchExpenses = useCallback(() => {
		if (!budgetId) return []
		return getExpensesForBudget(budgetId)
	}, [getExpensesForBudget, budgetId])

	return useQuery<Expense[], Error>(['expensesBudget', budgetId], fetchExpenses, {
		refetchInterval: 180 * 1000,
		retryDelay: 1 * 1000,
		retry: 3,
	})
}

