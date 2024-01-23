import axios from 'axios'
import { Category } from '../../models/category'
import { useEffect, useState } from 'react'
import { BREEZE_ENV } from '../environment'

export const useGetCategory = (budgetId: number, categoryId: number): Category => {
	const [result, setResult] = useState<Category>({} as Category)

	useEffect(() => {
		const fetchCategories = async () => {
			const response = await axios.get<Category>(`${BREEZE_ENV.BASE_URL}/Categories/${budgetId}/${categoryId}}`)
			setResult(response.data)
		}

		fetchCategories()
	}, [budgetId, categoryId])

	return result
}

export const useGetCategories = (budgetId: number): Category[] => {
	const [result, setResult] = useState<Category[]>([])

	useEffect(() => {
		const fetchCategories = async () => {
			const response = await axios.get<Category[]>(`${BREEZE_ENV.BASE_URL}/Categories/${budgetId}`)
			setResult(response.data)
		}

		fetchCategories()
	}, [budgetId])

	return result
}

export const usePostCategory = (category: Category) => {
	const [result, setResult] = useState<number | undefined>(undefined)

	useEffect(() => {
		const postCategory = async () => {
			const response = await axios.post<Category>(`${BREEZE_ENV.BASE_URL}/Categories/`, category)
			if (response.status === 200) {
				setResult(category.id)
			} else {
				setResult(-1)
			}
		}

		postCategory()
	}, [category])

	return result
}

export const useUpdateCategory = (category: Category) => {
	const [result, setResult] = useState<number | undefined>(undefined)

	useEffect(() => {
		const updateCategory = async () => {
			const response = await axios.put<Category>(`${BREEZE_ENV.BASE_URL}/Categories/`, category)
			if (response.status === 200) {
				setResult(category.id)
			} else {
				setResult(-1)
			}
		}

		updateCategory()
	}, [category])

	return result
}

export const useDeleteCategory = (id: number) => {
	const [result, setResult] = useState<number | undefined>(undefined)

	useEffect(() => {
		const deleteCategory = async () => {
			const response = await axios.delete<Category>(`${BREEZE_ENV.BASE_URL}/Categories/${id}`)
			if (response.status === 200) {
				setResult(id)
			} else {
				setResult(-1)
			}
		}

		deleteCategory()
	}, [id])

	return result
}
