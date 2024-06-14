import useHttp from "./useHttp"

export type Budget = {
	id: number
	userId: string
	monthlyIncome: number
	monthlyExpenses: number
	year: number
	month: number
}

export const useBudgets = () => {
	const { getOne, post, patch, deleteOne } = useHttp()

	// used
	const getBudget = async (year: number, month: number): Promise<Budget> => await getOne<Budget>(`budgets/${year}-${month}`)

	const postBudget = async (budget: Budget): Promise<number> => post<number, Budget>('budgets', budget)

	const patchBudget = async (budget: Budget): Promise<number> => patch<number, Budget>('budgets', budget)

	const deleteBudget = async (budgetId: number) => deleteOne<Budget>(`budgets/${budgetId}`)

	return { getBudget, postBudget, patchBudget, deleteBudget }
}
