/* eslint-disable react-refresh/only-export-components */
import React, { useState } from 'react'
import { Budget, emptyBudget } from '../models/budget'
import { useGetBudget } from '../hooks/BudgetServices'

// declares types used in this file
type BudgetProviderProps = {
	children: React.ReactNode[] | React.ReactNode
}

type BudgetContextType = {
	budget: Budget
	GetBudget: (date: Date) => Budget
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

/**
 * Budget provider that provides the budget context to all children
 * Example to access functions:
 * const budgetContext = useContext(BudgetContext)
 * const { UpdateCategory } = budgetContext
 */
export const BudgetProvider = (props: BudgetProviderProps) => {
	const [budget, setBudget] = useState<Budget>(emptyBudget)

	const GetBudget = (date: Date): Budget => {
		const budget = useGetBudget(date)
		if (!budget) return emptyBudget
		setBudget(budget)
		return budget
	}

	return (
		<BudgetContext.Provider
			value={{
				budget,
				GetBudget,
			}}
		>
			{props.children}
		</BudgetContext.Provider>
	)
}
