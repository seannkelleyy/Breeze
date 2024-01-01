import { Expense } from './expense'

export type Category = {
	id?: number
	name: string
	userId?: string
	budgetId?: number
	curentSpend: number
	budget: number
	expenses: Expense[]
}

export const emptyCategory: Category = {
	name: '',
	curentSpend: 0,
	budget: 0,
	expenses: [],
}