import { Category } from './category'
import { Income } from './income'

export type Budget = {
	id?: number
	userId?: string
	date: Date
	monthlyIncome: number
	monthlySavings: number
	categories: Category[]
	incomes: Income[]
}

export const emptyBudget: Budget = {
	userId: '',
	date: new Date(),
	monthlyIncome: 0,
	monthlySavings: 0,
	categories: [],
	incomes: [],
}
