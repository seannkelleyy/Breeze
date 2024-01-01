import axios from 'axios'
import { Expense } from '../models/expense'
import { useEffect, useState } from 'react'

export const GetExpenses = (categoryId: number): Expense[] => {
	const [result, setResult] = useState<Expense[]>([])

	useEffect(() => {
		const fetchExpenses = async () => {
			const response = await axios.get<Expense[]>(`https://localhost:7152/Expenses/${categoryId}`)
			setResult(response.data)
		}

		fetchExpenses()
	}, [categoryId])

	return result
}

export const PostExpense = (expense: Expense) => {
	const [result, setResult] = useState<number | undefined>(undefined)

	useEffect(() => {
		const postExpense = async () => {
			const response = await axios.post<Expense>('https://localhost:7152/Expenses', expense)
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

export const UpdateExpense = (expense: Expense) => {
	const [result, setResult] = useState<number | undefined>(undefined)

	useEffect(() => {
		const updateExpense = async () => {
			const response = await axios.put<Expense>('https://localhost:7152/Expenses', expense)
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

export const DeleteExpense = (id: number) => {
	const [result, setResult] = useState<number | undefined>(undefined)

	useEffect(() => {
		const deleteExpense = async () => {
			const response = await axios.delete<Expense>(`https://localhost:7152/Expenses/${id}`)
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
