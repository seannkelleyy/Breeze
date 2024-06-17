import useHttp from "../useHttp"

export type Income = {
	id?: number
	userId: string
	budgetId: number
	name: string
	amount: number
	year: number
	month: number
	day: number
}

// Only getIncomes, postIncome and deleteIncome are used in the app currently. Everything else is unused, but I'm keeping it because 
// I want to keep an example of this pattern in the codebase.
export const useIncomes = () => {
	const { getOne, getMany, post, patch, deleteOne } = useHttp()

	const getIncome = async (income: Income): Promise<Income> => await getOne<Income>(`budgets/${income.budgetId}/incomes/${income.id}`)

	const getIncomes = async (budgetId: number): Promise<Income[]> => await getMany<Income>(`budgets/${budgetId}/incomes`)

	const postIncome = async (income: Income): Promise<number> => await post<number, Income>(`budgets/${income.budgetId}/incomes`, income);

	const patchIncome = async (income: Income): Promise<number> => patch<number, Income>(`budgets/${income.budgetId}/incomes`, income)

	const deleteIncome = async (income: Income) => deleteOne<Income>(`budgets/${income.budgetId}/incomes/${income.id}`)

	return { getIncome, getIncomes, postIncome, patchIncome, deleteIncome }
}
