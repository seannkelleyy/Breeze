import axios from 'axios'
import { Expense } from '../models/expense'

export const GetExpenses = async (categoryId: number): Promise<Expense[]> => {
	const res = await axios.get<Expense[]>('https://localhost:7152/Expenses/' + categoryId).then((response) => {
		return response.data
	})
	return res
}

export const PostExpense = async (expense: Expense) => {
	const res = await axios.post<Expense>('https://localhost:7152/Expenses', expense).then((response) => {
		if (response.status === 200) {
			return expense.id
		} else {
			return response.data
		}
	})
	return res
}

export const UpdateExpense = async (expense: Expense) => {
	const res = await axios.put<Expense>('https://localhost:7152/Expenses', expense).then((response) => {
		if (response.status === 200) {
			return expense.id
		} else {
			return response.data
		}
	})
	return res
}

export const DeleteExpense = async (id: number) => {
	const res = await axios.delete<Expense>('https://localhost:7152/Expenses/' + id).then((response) => {
		if (response.status === 200) {
			return id
		} else {
			return response.data
		}
	})
	return res
}
