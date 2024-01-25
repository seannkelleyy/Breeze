import axios from 'axios'
import { Income } from '../../models/income'
import { BASE_API_URL } from '../environment'

export const getIncomes = (budgetId: number) => {
	return axios.get<Income[]>(`${BASE_API_URL}/Incomes/${budgetId}`)
}

export const postIncome = (income: Income) => {
	return axios.post<Income>(`${BASE_API_URL}/Incomes/`, income)
}

export const putIncome = (income: Income) => {
	return axios.put<Income>(`${BASE_API_URL}/Incomes/`, income)
}

export const deleteIncome = (id: number) => {
	return axios.delete<Income>(`${BASE_API_URL}/Incomes/${id}`)
}
