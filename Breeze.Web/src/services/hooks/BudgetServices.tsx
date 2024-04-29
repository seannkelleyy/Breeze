import axios from 'axios'
import { Budget } from '../models/budget'
import { FakeBudget } from '../FakeData'
import { BASE_API_URL } from '../environment'

export const getBudget = (date: Date) => {
	// 		return axios.get<Budget>(`${BASE_API_URL}/Budgets/${date.toISOString()}`)
	return FakeBudget
}

export const postBudget = (budget: Budget) => {
	return axios.post<Budget>(`${BASE_API_URL}/Budgets`, budget)
}

export const updateBudget = (budget: Budget) => {
	return axios.put<Budget>(`${BASE_API_URL}/Budgets`, budget)
}

export const deleteBudget = (budgetId: number) => {
	return axios.delete<Budget>(`${BASE_API_URL}/Budgets/${budgetId}`)
}
