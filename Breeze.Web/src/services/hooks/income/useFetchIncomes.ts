import { useQuery } from 'react-query'
import { useCallback } from 'react'
import { Income, useIncomes } from './IncomeServices'

type FetchIncomesProps = {
	budgetId: number
}

export const useFetchIncomes = ({ budgetId }: FetchIncomesProps) => {
	const { getIncomes } = useIncomes()

	const fetchIncome = useCallback(() => {
		return getIncomes(budgetId)
	}, [getIncomes, budgetId])

	return useQuery<Income[], Error>(['income', budgetId], fetchIncome, {
		refetchInterval: 180 * 1000,
		refetchOnMount: 'always',
		enabled: true,
		retryDelay: 30 * 1000,
	})
}