import axios from 'axios'
import { Budget } from '../models/budget'
import { useEffect, useState } from 'react'

export const GetBudget = (date: Date): Budget | undefined => {
	const [result, setResult] = useState<Budget | undefined>(undefined)

	useEffect(() => {
		const fetchBudget = async () => {
			const response = await axios.get<Budget>(`https://localhost:7152/Budgets/${date.toISOString()}`)
			setResult(response.data)
		}

		fetchBudget()
	}, [date])

	return result
}

export const PostBudget = (budget: Budget) => {
	const [result, setResult] = useState<number | undefined>(undefined)

	useEffect(() => {
		const postBudget = async () => {
			const response = await axios.post<Budget>('https://localhost:7152/Budgets', budget)
			if (response.status === 200) {
				setResult(budget.id)
			} else {
				setResult(-1)
			}
		}

		postBudget()
	}, [budget])

	return result
}

export const UpdateBudget = (budget: Budget) => {
	const [result, setResult] = useState<number | undefined>(undefined)

	useEffect(() => {
		const updateBudget = async () => {
			const response = await axios.put<Budget>('https://localhost:7152/Budgets', budget)
			if (response.status === 200) {
				setResult(budget.id)
			} else {
				setResult(-1)
			}
		}

		updateBudget()
	}, [budget])

	return result
}

export const DeleteBudget = (budgetId: number) => {
	const [result, setResult] = useState<number | undefined>(undefined)

	useEffect(() => {
		const deleteBudget = async () => {
			const response = await axios.delete<Budget>(`https://localhost:7152/Budgets/${budgetId}`)
			if (response.status === 200) {
				setResult(budgetId)
			} else {
				setResult(-1)
			}
		}

		deleteBudget()
	}, [budgetId])

	return result
}
