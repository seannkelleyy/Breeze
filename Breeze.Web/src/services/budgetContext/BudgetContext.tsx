/* eslint-disable react-refresh/only-export-components */
import React, { useState } from 'react'
import { Budget, emptyBudget } from '../../models/budget'
import { Income } from '../../models/income'
import { Category } from '../../models/category'
import { Expense } from '../../models/expense'
import { useDeleteBudget, useGetBudget, usePostBudget, useUpdateBudget } from '../apiHooks/BudgetServices'
import { useDeleteIncome, useGetIncomes, usePostIncome, useUpdateIncome } from '../apiHooks/IncomeServices'
import { useDeleteExpense, useGetExpenses, usePostExpense, useUpdateExpense } from '../apiHooks/ExpenseServices'
import { useDeleteCategory, useGetCategories, usePostCategory, useUpdateCategory } from '../apiHooks/CategoryServices'

// declares types used in this file
type BudgetProviderProps = {
	children: React.ReactNode[] | React.ReactNode
}

type BudgetContextType = {
	budget: Budget
	GetBudget: (date: Date) => Budget
	GetBudgetIncomes: (budgetId: number) => Income[]
	GetBudgetCategories: (budgetId: number) => Category[]
	GetCetegoryExpenses: (categoryId: number) => Expense[]
	AddBudget: (budget: Budget) => void
	AddIncome: (income: Income) => void
	AddCategory: (category: Category) => void
	AddExpense: (expense: Expense) => void
	UpdateBudget: (budget: Budget) => void
	UpdateIncome: (income: Income) => void
	UpdateCategory: (category: Category) => void
	UpdateExpense: (expense: Expense) => void
	DeleteBudget: (id: number) => void
	DeleteIncome: (id: number) => void
	DeleteCategory: (id: number) => void
	DeleteExpense: (id: number) => void
}

// creates budget context and defaults to an empty budget
export const BudgetContext = React.createContext<BudgetContextType>(emptyBudget as unknown as BudgetContextType)

/*  this is what will be called when accessing the const
 *  ex: const budgetContext = useBudget(Date.now())
 *  this will return the budget for the date provided or an empty budget
 */
export const useBudget = (date: Date) => {
	const [budget, setBudget] = useState<Budget>(emptyBudget)

	const FetchBudget = async () => {
		const response = await useGetBudget(date)
		if (!response) return
		setBudget(response)
	}

	FetchBudget()

	return budget
}

export const BudgetProvider = (props: BudgetProviderProps) => {
	const [budget, setBudget] = useState<Budget>(emptyBudget)

	const GetBudget = (date: Date): Budget => {
		const budget = useGetBudget(date)
		if (!budget) return emptyBudget
		setBudget(budget)
		return budget
	}

	const GetBudgetCategories = (budgetId: number) => {
		return useGetCategories(budgetId)
	}

	const GetBudgetIncomes = (budgetId: number) => {
		return useGetIncomes(budgetId)
	}

	const GetCetegoryExpenses = (categoryId: number) => {
		return useGetExpenses(categoryId)
	}

	const AddBudget = (budget: Budget) => {
		usePostBudget(budget)
	}

	const AddIncome = (income: Income) => {
		usePostIncome(income)
	}

	const AddCategory = (category: Category) => {
		usePostCategory(category)
	}

	const AddExpense = (expense: Expense) => {
		usePostExpense(expense)
	}

	const UpdateBudget = (budget: Budget) => {
		useUpdateBudget(budget)
	}

	const UpdateIncome = (income: Income) => {
		useUpdateIncome(income)
	}

	const UpdateCategory = (category: Category) => {
		useUpdateCategory(category)
	}

	const UpdateExpense = (expense: Expense) => {
		useUpdateExpense(expense)
	}

	const DeleteBudget = (id: number) => {
		useDeleteBudget(id)
	}

	const DeleteIncome = (id: number) => {
		useDeleteIncome(id)
	}

	const DeleteCategory = (id: number) => {
		useDeleteCategory(id)
	}

	const DeleteExpense = (id: number) => {
		useDeleteExpense(id)
	}

	return (
		<BudgetContext.Provider
			value={{
				budget,
				GetBudget,
				GetBudgetIncomes,
				GetBudgetCategories,
				GetCetegoryExpenses,
				AddBudget,
				AddIncome,
				AddCategory,
				AddExpense,
				UpdateBudget,
				UpdateIncome,
				UpdateCategory,
				UpdateExpense,
				DeleteBudget,
				DeleteIncome,
				DeleteCategory,
				DeleteExpense,
			}}
		>
			{props.children}
		</BudgetContext.Provider>
	)
}
