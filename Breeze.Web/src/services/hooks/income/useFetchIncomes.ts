import { useQuery } from 'react-query'
import { useCallback } from 'react'
import { Income, useIncomes } from './incomeServices'

type FetchIncomesProps = {
	budgetId: number
	enabled?: boolean
}

/**
 * A hook for fetching income data.
 * @param budgetId. The Id of the budget to fetch incomes for.
 * @param enabled. - optional - Determines whether or not the request is made.
 */
export const useFetchIncomes = ({ budgetId, enabled }: FetchIncomesProps) => {
	const { getIncomes } = useIncomes()

	const fetchIncome = useCallback(() => {
		if (!enabled) {
			return []
		}
		return getIncomes(budgetId)
	}, [getIncomes, budgetId, enabled])

	return useQuery<Income[], Error>(['income', budgetId], fetchIncome, {
		refetchInterval: 180 * 1000,
		retryDelay: 10 * 1000,
		enabled: enabled
	})
}