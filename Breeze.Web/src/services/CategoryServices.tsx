import axios from 'axios'
import { Category } from '../models/category'

export const GetCategories = async (budgetId: number): Promise<Category[]> => {
	const res = await axios.get<Category[]>('https://localhost:7152/Categories/' + budgetId).then((response) => {
		return response.data
	})
	return res
}

export const PostCategory = async (category: Category) => {
	const res = await axios.post<Category>('https://localhost:7152/Categories', category).then((response) => {
		if (response.status === 200) {
			return category.name
		} else {
			return response.data
		}
	})
	return res
}

export const UpdateCategory = async (category: Category) => {
	const res = await axios.put<Category>('https://localhost:7152/Categories', category).then((response) => {
		if (response.status === 200) {
			return category.name
		} else {
			return response.data
		}
	})
	return res
}

export const DeleteCategory = async (id: number) => {
	const res = await axios.delete<Category>('https://localhost:7152/Categories/' + id).then((response) => {
		if (response.status === 200) {
			return id
		} else {
			return response.data
		}
	})
	return res
}
