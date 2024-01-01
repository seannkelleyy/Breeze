import { Category, emptyCategory } from './category'
import { Income, emptyIncome } from './income'

export type Budget = {
	id: number
	userId?: string
	date: Date
	monthlyIncome: number
	monthlyExpenses: number
	monthlySavings: number
	categories: Category[]
	incomes: Income[]
}

export const emptyBudget: Budget = {
	id: 0,
	userId: '',
	date: new Date(),
	monthlyIncome: 0,
	monthlyExpenses: 0,
	monthlySavings: 0,
	categories: [emptyCategory],
	incomes: [emptyIncome],
}
