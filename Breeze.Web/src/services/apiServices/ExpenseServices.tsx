/* eslint-disable react-refresh/only-export-components */
import axios from 'axios'
import { Expense } from '../../models/expense'
import { BASE_API_URL } from '../environment'

export const getExpenses = (categoryId: number) => {
	return axios.get<Expense[]>(`${BASE_API_URL}/Expenses/${categoryId}`)
}

export const postExpense = (expense: Expense) => {
	return axios.post<Expense>(`${BASE_API_URL}/${expense.categoryId}/Expenses/`)
}

export const updateExpense = (expense: Expense) => {
	return axios.put<Expense>(`${BASE_API_URL}/Expenses`, expense)
}

export const deleteExpense = (id: number) => {
	return axios.delete<Expense>(`${BASE_API_URL}/Expenses/${id}`)
}
