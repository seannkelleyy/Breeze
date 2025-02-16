import { Category } from '../category/categoryServices'
import useHttp from '../useHttp'

export type Expense = {
	id?: number
	userId: string
	categoryId: number
	name: string
	amount: number
	date: string
}

/**
 * A hook for fetching expense data. This should only be used when creating new hooks with ReactQuery.
 */
export const useExpenses = () => {
	const { getMany, post, patch, deleteOne } = useHttp()

	const getExpenses = async (category: Category): Promise<Expense[]> => await getMany<Expense>(`budgets/${category.budgetId}/categories/${category.id}/expenses`)

	const postExpense = async (budgetId: number, expense: Expense): Promise<number> => post<number, Expense>(`budgets/${budgetId}/categories/${expense.categoryId}/expenses`, expense)

	const patchExpense = async (budgetId: number, expense: Expense): Promise<number> =>
		patch<number, Expense>(`budgets/${budgetId}/categories/${expense.categoryId}/expenses`, expense)

	const deleteExpense = async (budgetId: number, expense: Expense) => deleteOne<Expense>(`budgets/${budgetId}/categories/${expense.categoryId}/expenses/${expense.id}`)

	return { getExpenses, postExpense, patchExpense, deleteExpense }
}

