import useHttp from "../useHttp"

export type Budget = {
	id: number
	userId: string
	monthlyIncome: number
	monthlyExpenses: number
	year: number
	month: number
}

// Only getBudget is used in the app currently. Everything else is unused, but I'm keeping it because 
// I want to keep an example of this pattern in the codebase for reference.
export const useBudgets = () => {
	const { getOne, post, patch, deleteOne } = useHttp()

	const getBudget = async (year: number, month: number): Promise<Budget> => await getOne<Budget>(`budgets/${year}-${month}`)

	const postBudget = async (budget: Budget): Promise<number> => post<number, Budget>('budgets', budget)

	const patchBudget = async (budget: Budget): Promise<number> => patch<number, Budget>('budgets', budget)

	const deleteBudget = async (budgetId: number) => deleteOne<Budget>(`budgets/${budgetId}`)

	return { getBudget, postBudget, patchBudget, deleteBudget }
}
