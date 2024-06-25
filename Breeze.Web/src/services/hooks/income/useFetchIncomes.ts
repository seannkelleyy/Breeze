import { useQuery } from 'react-query'
import { useCallback } from 'react'
import { Income, useIncomes } from './incomeServices'

type FetchIncomesProps = {
	budgetId: number
}

/**
 * A hook for fetching income data.
 * @param budgetId. The Id of the budget to fetch incomes for.
 */
export const useFetchIncomes = ({ budgetId }: FetchIncomesProps) => {
	const { getIncomes } = useIncomes()

	const fetchIncome = useCallback(() => {
		return getIncomes(budgetId)
	}, [getIncomes, budgetId])

	return useQuery<Income[], Error>(['income', budgetId], fetchIncome, {
		refetchInterval: 180 * 1000,
		refetchOnMount: 'always',
		retryDelay: 10 * 1000,
	})
}