import axios from 'axios'
import { Category } from '../models/category'
import { useEffect, useState } from 'react'

export const GetCategory = (budgetId: number, categoryId: number): Category => {
	const [result, setResult] = useState<Category>({} as Category)

	useEffect(() => {
		const fetchCategories = async () => {
			const response = await axios.get<Category>(`https://localhost:7152/Categories/${budgetId}/${categoryId}}`)
			setResult(response.data)
		}

		fetchCategories()
	}, [budgetId, categoryId])

	return result
}

export const GetCategories = (budgetId: number): Category[] => {
	const [result, setResult] = useState<Category[]>([])

	useEffect(() => {
		const fetchCategories = async () => {
			const response = await axios.get<Category[]>(`https://localhost:7152/Categories/${budgetId}`)
			setResult(response.data)
		}

		fetchCategories()
	}, [budgetId])

	return result
}

export const PostCategory = (category: Category) => {
	const [result, setResult] = useState<number | undefined>(undefined)

	useEffect(() => {
		const postCategory = async () => {
			const response = await axios.post<Category>('https://localhost:7152/Categories', category)
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

export const UpdateCategory = (category: Category) => {
	const [result, setResult] = useState<number | undefined>(undefined)

	useEffect(() => {
		const updateCategory = async () => {
			const response = await axios.put<Category>('https://localhost:7152/Categories', category)
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

export const DeleteCategory = (id: number) => {
	const [result, setResult] = useState<number | undefined>(undefined)

	useEffect(() => {
		const deleteCategory = async () => {
			const response = await axios.delete<Category>(`https://localhost:7152/Categories/${id}`)
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
