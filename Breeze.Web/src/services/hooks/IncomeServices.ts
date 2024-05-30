import useHttp from './useHttp'

export type Income = {
	id?: number
	userId?: string
	budgetId?: number
	name: string
	date: Date
	amount: number
}

// This is used to initialize a new income
export const EmptyIncome: Income = {
	name: 'Income Name',
	date: new Date(),
	amount: 0,
}

export const useIncomes = () => {
	const { getOne, getMany, post, patch, deleteOne } = useHttp()

	const getIncome = async (income: Income): Promise<Income> => await getOne<Income>(`/budgets/${income.budgetId}/incomes/${income.id}`)

	const getIncomes = async (income: Income): Promise<Income[]> => await getMany<Income>(`/budgets/${income.budgetId}/incomes`)

	const postIncome = async (income: Income) => post<Income, Income>(`/budgets/${income.budgetId}/incomes`, income)

	const patchIncome = async (income: Income) => patch<Income, Income>(`/budgets/${income.budgetId}/incomes`, income)

	const deleteIncome = async (income: Income) => deleteOne<Income>(`/budgets/${income.budgetId}/incomes/${income.id}`)

	return { getIncome, getIncomes, postIncome, patchIncome, deleteIncome }
}
