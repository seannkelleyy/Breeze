import useHttp from "../useHttp"

export type Budget = {
	id: number
	userId: string
	monthlyIncome: number
	monthlyExpenses: number
	date: string
}

/**
 * A hook for fetching budget data. This should only be used when creating new hooks with ReactQuery.
 */
export const useBudgets = () => {
	const { getOne } = useHttp()

	const getBudget = async (year: number, month: number): Promise<Budget> => await getOne<Budget>(`budgets/${year}-${month}`)

	return { getBudget }
}
