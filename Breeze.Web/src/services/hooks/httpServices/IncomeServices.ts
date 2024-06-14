import useHttp from "./useHttp"

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

export const useIncomes = () => {
	const { getOne, getMany, post, patch, deleteOne } = useHttp()

	const getIncome = async (income: Income): Promise<Income> => await getOne<Income>(`budgets/${income.budgetId}/incomes/${income.id}`)

	// used
	const getIncomes = async (budgetId: number): Promise<Income[]> => await getMany<Income>(`budgets/${budgetId}/incomes`)

	// used
	const postIncome = async (income: Income): Promise<number> => await post<number, Income>(`budgets/${income.budgetId}/incomes`, income);

	const patchIncome = async (income: Income): Promise<number> => patch<number, Income>(`budgets/${income.budgetId}/incomes`, income)

	const deleteIncome = async (income: Income) => deleteOne<Income>(`budgets/${income.budgetId}/incomes/${income.id}`)

	return { getIncome, getIncomes, postIncome, patchIncome, deleteIncome }
}
