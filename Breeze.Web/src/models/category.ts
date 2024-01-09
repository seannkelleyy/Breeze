import { Expense } from './expense'

export type Category = {
	id?: number
	name: string
	userId?: string
	budgetId?: number
	curentSpend: number
	amount: number
	expenses: Expense[]
}

// This is used to inialize a new category
export const emptyCategory: Category = {
	name: 'Category Name',
	curentSpend: 0,
	amount: 0,
	expenses: [],
}