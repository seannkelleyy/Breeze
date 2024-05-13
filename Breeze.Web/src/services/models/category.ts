import { Expense } from './expense'

export type Category = {
	id?: number
	name: string
	userId?: string
	budgetId?: number
	currentSpend: number
	allocation: number
	expenses: Expense[]
}

// This is used to initialize a new category
export const emptyCategory: Category = {
	name: 'Category Name',
	currentSpend: 0,
	allocation: 0,
	expenses: [],
}