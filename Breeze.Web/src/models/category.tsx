import { Expense } from './expense'

export type Category = {
	id: number
	name: string
	userId: string
	budgetId: number
	curentSpend: number
	budget: number
	date: Date
	expenses: Expense[]
}
