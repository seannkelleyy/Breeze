import dayjs from 'dayjs'
import { Budget } from '../hooks/budget/budgetServices'

export const testBudget: Budget = {
	id: 1,
	userId: '',
	date: dayjs().format('MMMM YYYY'),
	monthlyIncome: 7250,
	monthlyExpenses: 4765.32,
}

