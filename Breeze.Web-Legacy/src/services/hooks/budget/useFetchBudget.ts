import { useQuery } from 'react-query'

import { useCallback } from 'react'
import { Budget, useBudgets } from './budgetServices'
import { Dayjs } from 'dayjs'

type FetchBudgetProps = {
	date: Dayjs
}

/**
 * A hook for fetching budget data.
 * @param year. The year of the budget.
 * @param month. The month of the budget.
 */
export const useFetchBudget = ({ date }: FetchBudgetProps) => {
	const { getBudget } = useBudgets()

	const fetchBudget = useCallback(() => {
		return getBudget(date.year(), date.month() + 1)
	}, [getBudget, date])

	return useQuery<Budget, Error>(['budget', date.format('YYYY-MM')], fetchBudget, {
		refetchInterval: 180 * 1000,
		retryDelay: 10 * 1000,
	})
}
