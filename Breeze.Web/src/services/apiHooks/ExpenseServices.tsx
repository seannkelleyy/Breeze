/* eslint-disable react-refresh/only-export-components */
import axios from 'axios'
import { Expense } from '../../models/expense'
import { useEffect, useState } from 'react'
import { BREEZE_ENV } from '../environment'

export const useGetExpenses = (categoryId: number): Expense[] => {
	const [result, setResult] = useState<Expense[]>([])

	useEffect(() => {
		const fetchExpenses = async () => {
			const response = await axios.get<Expense[]>(`${BREEZE_ENV.BASE_URL}/Expenses/${categoryId}`)
			setResult(response.data)
		}

		fetchExpenses()
	}, [categoryId])

	return result
}

export const usePostExpense = (expense: Expense) => {
	const [result, setResult] = useState<number | undefined>(undefined)

	useEffect(() => {
		const postExpense = async () => {
			const response = await axios.post<Expense>(`${BREEZE_ENV.BASE_URL}/${expense.categoryId}/Expenses/`)
			if (response.status === 200) {
				setResult(expense.id)
			} else {
				setResult(-1)
			}
		}

		postExpense()
	}, [expense])

	return result
}

export const useUpdateExpense = (expense: Expense) => {
	const [result, setResult] = useState<number | undefined>(undefined)

	useEffect(() => {
		const updateExpense = async () => {
			const response = await axios.put<Expense>(`${BREEZE_ENV.BASE_URL}/Expenses`, expense)
			if (response.status === 200) {
				setResult(expense.id)
			} else {
				setResult(-1)
			}
		}

		updateExpense()
	}, [expense])

	return result
}

export const useDeleteExpense = (id: number) => {
	const [result, setResult] = useState<number | undefined>(undefined)

	useEffect(() => {
		const deleteExpense = async () => {
			const response = await axios.delete<Expense>(`${BREEZE_ENV.BASE_URL}/Expenses/${id}`)
			if (response.status === 200) {
				setResult(id)
			} else {
				setResult(-1)
			}
		}

		deleteExpense()
	}, [id])

	return result
}
