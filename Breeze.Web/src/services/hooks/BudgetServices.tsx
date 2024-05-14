import axios from 'axios'
import { Budget } from '../models/budget'
import { FakeBudget } from '../FakeData'
import { BASE_API_URL } from '../environment'
import { useAxiosWithAuth } from './Auth0Service'

export const useGetBudget = (date: Date) => {
	const axiosInstance = useAxiosWithAuth()
	return axiosInstance.get<Budget>(`https://localhost:7284/budgets/${date.getFullYear()}/${date.getMonth() + 1}`)
	//return FakeBudget
}

export const postBudget = (budget: Budget) => {
	return axios.post<Budget>(`${BASE_API_URL}/budgets`, budget)
}

export const updateBudget = (budget: Budget) => {
	return axios.put<Budget>(`${BASE_API_URL}/budgets`, budget)
}

export const deleteBudget = (budgetId: number) => {
	return axios.delete<Budget>(`${BASE_API_URL}/budgets/${budgetId}`)
}
