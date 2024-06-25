import { useQuery } from 'react-query'

import { useCallback } from 'react'
import { Budget, useBudgets } from './budgetServices'

type FetchBudgetProps = {
	year: number
	month: number
}

/**
 * A hook for fetching budget data.
 * @param year. The year of the budget.
 * @param month. The month of the budget.
 */
export const useFetchBudget = ({ year, month }: FetchBudgetProps) => {
	const { getBudget } = useBudgets()

	const fetchBudget = useCallback(() => {
		return getBudget(year, month)
	}, [getBudget, year, month])

	return useQuery<Budget, Error>(['budget', year, month], fetchBudget, {
		refetchInterval: 180 * 1000,
		refetchOnMount: 'always',
		retryDelay: 10 * 1000,
	})
}
