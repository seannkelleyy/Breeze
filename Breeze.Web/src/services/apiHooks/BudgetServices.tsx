/* eslint-disable react-refresh/only-export-components */
import axios from 'axios'
import { Budget } from '../../models/budget'
import { useEffect, useState } from 'react'
import { FakeBudget } from '../FakeData'
import { BREEZE_ENV } from '../environment'

export const useGetBudget = (date: Date) => {
	console.log(date)
	//const [budget, setBudget] = useState<Budget | undefined>(undefined)

	// useEffect(() => {
	// 	const fetchBudget = async () => {
	// 		const response = await axios.get<Budget>(`${BREEZE_ENV.BASE_URL}/Budgets/${date.toISOString()}`)
	// 		setBudget(response.data)
	// 	}

	// 	fetchBudget()
	// }, [date])

	// change to budget when DB is set up
	return FakeBudget
}

export const usePostBudget = (budget: Budget) => {
	const [result, setResult] = useState<number | undefined>(undefined)

	useEffect(() => {
		const postBudget = async () => {
			const response = await axios.post<Budget>(`${BREEZE_ENV.BASE_URL}/Budgets`, budget)
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

export const useUpdateBudget = (budget: Budget) => {
	const [result, setResult] = useState<number | undefined>(undefined)

	useEffect(() => {
		const updateBudget = async () => {
			const response = await axios.put<Budget>(`${BREEZE_ENV.BASE_URL}/Budgets`, budget)
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

export const useDeleteBudget = (budgetId: number) => {
	const [result, setResult] = useState<number | undefined>(undefined)

	useEffect(() => {
		const deleteBudget = async () => {
			const response = await axios.delete<Budget>(`${BREEZE_ENV.BASE_URL}/Budgets/${budgetId}`)
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
