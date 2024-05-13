import { Expense } from './expense'

export type Category = {
	id?: number
	name: string
	userId?: string
	budgetId?: number
	curentSpend: number
	allocation: number
	expenses: Expense[]
}

// This is used to inialize a new category
export const emptyCategory: Category = {
	name: 'Category Name',
	curentSpend: 0,
	allocation: 0,
	expenses: [],
}