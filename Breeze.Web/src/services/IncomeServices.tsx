import axios from 'axios'
import { Income } from '../models/income'

export const GetIncomes = async (budgetId: number): Promise<Income[]> => {
	const res = await axios.get<Income[]>('https://localhost:7152/Incomes/' + budgetId).then((response) => {
		return response.data
	})
	return res
}

export const PostIncome = async (income: Income) => {
	const res = await axios.post<Income>('https://localhost:7152/Incomes', income).then((response) => {
		if (response.status === 200) {
			return income.id
		} else {
			return response.data
		}
	})
	return res
}

export const UpdateIncome = async (income: Income) => {
	const res = await axios.put<Income>('https://localhost:7152/Incomes', income).then((response) => {
		if (response.status === 200) {
			return income.id
		} else {
			return response.data
		}
	})
	return res
}

export const DeleteIncome = async (id: number) => {
	const res = await axios.delete<Income>('https://localhost:7152/Incomes/' + id).then((response) => {
		if (response.status === 200) {
			return id
		} else {
			return response.data
		}
	})
	return res
}
