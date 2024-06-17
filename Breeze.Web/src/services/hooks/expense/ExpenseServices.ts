/* eslint-disable react-refresh/only-export-components */
import { Category } from '../category/CategoryServices'
import useHttp from '../useHttp'

export type Expense = {
	id?: number
	userId: string
	categoryId: number
	name: string
	amount: number
	year: number
	month: number
	day: number
}

// Only getExpenses, postExpense and deleteExpenses are used in the app currently. Everything else is unused, but I'm keeping it because 
// I want to keep an example of this pattern in the codebase.
export const useExpenses = () => {
	const { getOne, getMany, post, patch, deleteOne } = useHttp()

	const getExpense = async (category: Category, expenseId: number): Promise<Expense> =>
		await getOne<Expense>(`budgets/${category.budgetId}/categories/${category.id}/expenses/${expenseId}`)

	const getExpenses = async (category: Category): Promise<Expense[]> => await getMany<Expense>(`budgets/${category.budgetId}/categories/${category.id}/expenses`)

	const postExpense = async (category: Category, expense: Expense): Promise<number> => post<number, Expense>(`budgets/${category.budgetId}/categories/${category.id}/expenses`, expense)

	const patchExpense = async (category: Category, expense: Expense): Promise<number> => patch<number, Expense>(`budgets/${category.budgetId}/categories/${category.id}/expenses`, expense)

	const deleteExpense = async (category: Category, expense: Expense) => deleteOne<Expense>(`budgets/${category.budgetId}/categories/${category.id}/expenses/${expense.id}`)

	return { getExpense, getExpenses, postExpense, patchExpense, deleteExpense }
}
