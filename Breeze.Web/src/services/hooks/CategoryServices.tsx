import axios from 'axios'
import { Category } from '../models/category'
import { BASE_API_URL } from '../environment'

export const useGetCategory = (budgetId: number, categoryId: number) => {
	return axios.get<Category>(`${BASE_API_URL}/Categories/${budgetId}/${categoryId}}`)
}

export const getCategories = (budgetId: number) => {
	return axios.get<Category[]>(`${BASE_API_URL}/Categories/${budgetId}`)
}

export const postCategory = (category: Category) => {
	return axios.post<Category>(`${BASE_API_URL}/Categories/`, category)
}

export const putCategory = (category: Category) => {
	return axios.put<Category>(`${BASE_API_URL}/Categories/`, category)
}

export const deleteCategory = (id: number) => {
	return axios.delete<Category>(`${BASE_API_URL}/Categories/${id}`)
}
