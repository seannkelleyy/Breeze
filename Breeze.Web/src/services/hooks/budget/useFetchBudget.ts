import { useQuery } from 'react-query'

import { useCallback } from 'react'
import { Budget, useBudgets } from './BudgetServices'

type FetchBudgetProps = {
	year: number
	month: number
}

export const useFetchBudget = ({ year, month }: FetchBudgetProps) => {
	const { getBudget } = useBudgets()

	const fetchBudget = useCallback(() => {
		return getBudget(year, month)
	}, [getBudget, year, month])

	return useQuery<Budget, Error>(['budget', year, month], fetchBudget, {
		refetchInterval: 180 * 1000,
		refetchOnMount: 'always',
		enabled: true,
	})
}
