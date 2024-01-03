/* eslint-disable react-refresh/only-export-components */
import React, { useContext, useState } from 'react'
import { Budget, emptyBudget } from '../../models/budget'
import { Income } from '../../models/income'
import { Category } from '../../models/category'
import { Expense } from '../../models/expense'
import { DeleteBudget, GetBudget, PostBudget, UpdateBudget } from '../BudgetServices'
import { DeleteIncome, GetIncomes, PostIncome, UpdateIncome } from '../IncomeServices'
import { DeleteExpense, GetExpenses, PostExpense, UpdateExpense } from '../ExpenseServices'
import { DeleteCategory, GetCategories, PostCategory, UpdateCategory } from '../CategoryServices'

type BudgetProviderProps = {
	children: React.ReactNode[] | React.ReactNode
}
type BudgetContextType = {
	budget: Budget
	getBudget: (date: Date) => void
	getBudgetIncomes: (budgetId: number) => void
	getBudgetCategories: (budgetId: number) => void
	getCetegoryExpenses: (categoryId: number) => void
	addBudget: (budget: Budget) => void
	addIncome: (income: Income) => void
	addCategory: (category: Category) => void
	addExpense: (expense: Expense) => void
	updateBudget: (budget: Budget) => void
	updateIncome: (income: Income) => void
	updateCategory: (category: Category) => void
	updateExpense: (expense: Expense) => void
	deleteBudget: (id: number) => void
	deleteIncome: (id: number) => void
	deleteCategory: (id: number) => void
	deleteExpense: (id: number) => void
}

const BudgetContext = React.createContext<BudgetContextType>({ budget: emptyBudget } as BudgetContextType)

export const useBudget = () => {
	return useContext(BudgetContext)
}

export const BudgetProvider = (props: BudgetProviderProps, date: Date) => {
	const [budget, setBudget] = useState<Budget>(GetBudget(date) || emptyBudget)

	// make it so budget is retrieved every 5 or so seconds??
	const getBudget = (date: Date) => {
		const budget = GetBudget(date)
		if (!budget) return emptyBudget
		setBudget(budget)
		return budget
	}

	const getBudgetCategories = (budgetId: number) => {
		return GetCategories(budgetId)
	}

	const getBudgetIncomes = (budgetId: number) => {
		return GetIncomes(budgetId)
	}

	const getCetegoryExpenses = (categoryId: number) => {
		return GetExpenses(categoryId)
	}

	const addBudget = (budget: Budget) => {
		PostBudget(budget)
	}

	const addIncome = (income: Income) => {
		PostIncome(income)
	}

	const addCategory = (category: Category) => {
		PostCategory(category)
	}

	const addExpense = (expense: Expense) => {
		PostExpense(expense)
	}

	const updateBudget = (budget: Budget) => {
		UpdateBudget(budget)
	}

	const updateIncome = (income: Income) => {
		UpdateIncome(income)
	}

	const updateCategory = (category: Category) => {
		UpdateCategory(category)
	}

	const updateExpense = (expense: Expense) => {
		UpdateExpense(expense)
	}

	const deleteBudget = (id: number) => {
		DeleteBudget(id)
	}

	const deleteIncome = (id: number) => {
		DeleteIncome(id)
	}

	const deleteCategory = (id: number) => {
		DeleteCategory(id)
	}

	const deleteExpense = (id: number) => {
		DeleteExpense(id)
	}

	return (
		<BudgetContext.Provider
			value={{
				budget,
				getBudget,
				getBudgetIncomes,
				getBudgetCategories,
				getCetegoryExpenses,
				addBudget,
				addIncome,
				addCategory,
				addExpense,
				updateBudget,
				updateIncome,
				updateCategory,
				updateExpense,
				deleteBudget,
				deleteIncome,
				deleteCategory,
				deleteExpense,
			}}
		>
			{props.children}
		</BudgetContext.Provider>
	)
}
