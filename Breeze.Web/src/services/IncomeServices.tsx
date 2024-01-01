import axios from 'axios'
import { Income } from '../models/income'
import { useEffect, useState } from 'react'

export const GetIncomes = (budgetId: number): Income[] => {
	const [result, setResult] = useState<Income[]>([])

	useEffect(() => {
		const fetchIncomes = async () => {
			const response = await axios.get<Income[]>(`https://localhost:7152/Incomes/${budgetId}`)
			setResult(response.data)
		}

		fetchIncomes()
	}, [budgetId])

	return result
}

export const PostIncome = (income: Income) => {
	const [result, setResult] = useState<number | undefined>(undefined)

	useEffect(() => {
		const postIncome = async () => {
			const response = await axios.post<Income>('https://localhost:7152/Incomes', income)
			if (response.status === 200) {
				setResult(income.id)
			} else {
				setResult(-1)
			}
		}

		postIncome()
	}, [income])

	return result
}

export const UpdateIncome = (income: Income) => {
	const [result, setResult] = useState<number | undefined>(undefined)

	useEffect(() => {
		const updateIncome = async () => {
			const response = await axios.put<Income>('https://localhost:7152/Incomes', income)
			if (response.status === 200) {
				setResult(income.id)
			} else {
				setResult(-1)
			}
		}

		updateIncome()
	}, [income])

	return result
}

export const DeleteIncome = (id: number) => {
	const [result, setResult] = useState<number | undefined>(undefined)

	useEffect(() => {
		const deleteIncome = async () => {
			const response = await axios.delete<Income>(`https://localhost:7152/Incomes/${id}`)
			if (response.status === 200) {
				setResult(id)
			} else {
				setResult(-1)
			}
		}

		deleteIncome()
	}, [id])

	return result
}
