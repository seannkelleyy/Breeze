/* eslint-disable react-refresh/only-export-components */
import { Category } from './CategoryServices'
import useHttp from './useHttp'

export type Expense = {
	id?: number
	userId?: string
	categoryId?: number
	name: string
	date: Date
	amount: number
}

// This is used to initialize a new expense
export const emptyExpense: Expense = {
	name: 'Expense Name',
	date: new Date(),
	amount: 0,
}

export const useExpenses = () => {
	const { getOne, getMany, post, patch, deleteOne } = useHttp()

	const getExpense = async (category: Category, expenseId: number): Promise<Expense> =>
		await getOne<Expense>(`/budgets/${category.budgetId}/categories/${category.id}/expenses/${expenseId}`)

	const getExpenses = async (category: Category): Promise<Expense[]> => await getMany<Expense>(`/budgets/${category.budgetId}/categories/${category.id}/expenses`)

	const postExpense = async (category: Category, expense: Expense) => post<Expense, Expense>(`/budgets/${category.budgetId}/categories/${category.id}/expenses`, expense)

	const patchExpense = async (category: Category, expense: Expense) => patch<Expense, Expense>(`/budgets/${category.budgetId}/categories/${category.id}/expenses`, expense)

	const deleteExpense = async (category: Category, expense: Expense) => deleteOne<Expense>(`/budgets/${category.budgetId}/categories/${category.id}/expenses/${expense.id}`)

	return { getExpense, getExpenses, postExpense, patchExpense, deleteExpense }
}
