import { Expense } from './ExpenseServices'
import useHttp from './useHttp'

export type Category = {
	id?: number
	userEmail: string
	name: string
	budgetId?: number
	currentSpend: number
	allocation: number
	expenses: Expense[]
}

export const useCategories = () => {
	const { getOne, getMany, post, patch, deleteOne } = useHttp()

	const getCategory = async (category: Category): Promise<Category> => await getOne<Category>(`/budgets/${category.budgetId}/categories/${category.id}`)

	const getCategories = async (budgetId: number): Promise<Category[]> => await getMany<Category>(`/budgets/${budgetId}/categories`)

	const postCategory = async (category: Category) => post<Category, Category>(`/budgets/${category.budgetId}/categories/`, category)

	const patchCategory = async (category: Category) => patch<Category, Category>(`/budgets/${category.budgetId}/categories/`, category)

	const deleteCategory = async (category: Category) => deleteOne<Category>(`/budgets/${category.budgetId}/categories/${category.id}`)

	return { getCategory, getCategories, postCategory, patchCategory, deleteCategory }
}
