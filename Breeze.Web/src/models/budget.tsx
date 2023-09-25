import { Category } from './category'
import { Income } from './income'

export type Budget = {
	id: number
	userId: string
	date: Date
	monthlyIncome: number
	monthlySavings: number
	categories: Category[]
	incomes: Income[]
}
