import axios from 'axios'
import { Budget } from '../models/budget'

export const GetBudget = async (date: Date): Promise<Budget> => {
	const res = await axios.get<Budget>('https://localhost:7152/Budgets/' + date.toISOString()).then((response) => {
		return response.data
	})
	return res
}

export const PostBudget = async (budget: Budget) => {
	const res = await axios.post<Budget>('https://localhost:7152/Budgets', budget).then((response) => {
		if (response.status === 200) {
			return budget.date
		} else {
			return response.data
		}
	})
	return res
}

export const UpdateBudget = async (budget: Budget) => {
	const res = await axios.put<Budget>('https://localhost:7152/Budgets', budget).then((response) => {
		if (response.status === 200) {
			return budget.date
		} else {
			return response.data
		}
	})
	return res
}

export const DeleteBudget = async (budgetId: number) => {
	const res = await axios.delete<Budget>('https://localhost:7152/Budgets/' + budgetId).then((response) => {
		if (response.status === 200) {
			return budgetId
		} else {
			return response.data
		}
	})
	return res
}
