import useHttp from '@/lib/services/useHttp'
import { Category } from '../../types/category'
import { Expense } from '../../types/expense'

/**
 * A hook for fetching expense data. This should only be used when creating new hooks with ReactQuery.
 */
const useExpenses = () => {
	const { getMany, post, patch, deleteOne } = useHttp()

	const getExpensesForCategory = async (category: Category): Promise<Expense[]> => await getMany<Expense>(`budgets/${category.budgetId}/categories/${category.id}/expenses`)

	const getExpensesForBudget = async (budgetId: number): Promise<Expense[]> => await getMany<Expense>(`budgets/${budgetId}/expenses`)

	const postExpense = async (budgetId: number, expense: Expense): Promise<number> => post<number, Expense>(`budgets/${budgetId}/categories/${expense.categoryId}/expenses`, expense)

	const patchExpense = async (budgetId: number, expense: Expense): Promise<number> =>
		patch<number, Expense>(`budgets/${budgetId}/categories/${expense.categoryId}/expenses`, expense)

	const deleteExpense = async (budgetId: number, expense: Expense) => deleteOne<Expense>(`budgets/${budgetId}/categories/${expense.categoryId}/expenses/${expense.id}`)

	return { getExpensesForCategory, getExpensesForBudget, postExpense, patchExpense, deleteExpense }
}

export default useExpenses

