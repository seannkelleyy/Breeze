/* eslint-disable react-refresh/only-export-components */
import { Category } from './CategoryServices'
import useHttp from './useHttp'

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

export const useExpenses = () => {
	const { getOne, getMany, post, patch, deleteOne } = useHttp()

	const getExpense = async (category: Category, expenseId: number): Promise<Expense> =>
		await getOne<Expense>(`budgets/${category.budgetId}/categories/${category.id}/expenses/${expenseId}`)

	//used
	const getExpenses = async (category: Category): Promise<Expense[]> => await getMany<Expense>(`budgets/${category.budgetId}/categories/${category.id}/expenses`)

	//used
	const postExpense = async (category: Category, expense: Expense): Promise<number> => post<number, Expense>(`budgets/${category.budgetId}/categories/${category.id}/expenses`, expense)

	const patchExpense = async (category: Category, expense: Expense): Promise<number> => patch<number, Expense>(`budgets/${category.budgetId}/categories/${category.id}/expenses`, expense)

	// used
	const deleteExpense = async (category: Category, expense: Expense) => deleteOne<Expense>(`budgets/${category.budgetId}/categories/${category.id}/expenses/${expense.id}`)

	return { getExpense, getExpenses, postExpense, patchExpense, deleteExpense }
}
