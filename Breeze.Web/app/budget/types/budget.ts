import z from 'zod'
import { Category, categoryFormSchema } from './category'
import { Income, incomeFormSchema } from './income'

export interface Budget {
	id: number
	userId: string
	monthlyIncome: number
	monthlyExpenses: number
	date: string
}

export const budgetFormSchema = z.object({
	incomes: z.array(incomeFormSchema),
	categories: z.array(categoryFormSchema),
})

export interface BudgetFormData {
	incomes: Income[]
	categories: Category[]
}

