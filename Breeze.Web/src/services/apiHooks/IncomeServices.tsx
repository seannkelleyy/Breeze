import axios from 'axios'
import { Income } from '../../models/income'
import { useEffect, useState } from 'react'
import { BREEZE_ENV } from '../environment'

export const useGetIncomes = (budgetId: number): Income[] => {
	const [result, setResult] = useState<Income[]>([])

	useEffect(() => {
		const fetchIncomes = async () => {
			const response = await axios.get<Income[]>(`${BREEZE_ENV.BASE_URL}/Incomes/${budgetId}`)
			setResult(response.data)
		}

		fetchIncomes()
	}, [budgetId])

	return result
}

export const usePostIncome = (income: Income) => {
	const [result, setResult] = useState<number | undefined>(undefined)

	useEffect(() => {
		const postIncome = async () => {
			const response = await axios.post<Income>(`${BREEZE_ENV.BASE_URL}/Incomes/`, income)
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

export const useUpdateIncome = (income: Income) => {
	const [result, setResult] = useState<number | undefined>(undefined)

	useEffect(() => {
		const updateIncome = async () => {
			const response = await axios.put<Income>(`${BREEZE_ENV.BASE_URL}/Incomes/`, income)
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

export const useDeleteIncome = (id: number) => {
	const [result, setResult] = useState<number | undefined>(undefined)

	useEffect(() => {
		const deleteIncome = async () => {
			const response = await axios.delete<Income>(`${BREEZE_ENV.BASE_URL}/Incomes/${id}`)
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
