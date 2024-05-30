/* eslint-disable react-refresh/only-export-components */
import React, { useEffect, useState } from 'react'
import { Budget, EmptyBudget, useBudgets } from '../hooks/BudgetServices'

// declares types used in this file
type BudgetProviderProps = {
	children: React.ReactNode[] | React.ReactNode
}

type BudgetContextType = {
	budget: Budget
	GetBudget: (date: Date) => Promise<Budget>
}

// creates budget context and defaults to an empty budget
export const BudgetContext = React.createContext<BudgetContextType>(EmptyBudget as unknown as BudgetContextType)

/*  this is what will be called when accessing the const
 *  ex: const budgetContext = useBudget(Date.now())
 *  this will return the budget for the date provided or an empty budget
 */
export const useBudget = (date: Date) => {
	const { getBudget } = useBudgets()
	const [budget, setBudget] = useState<Budget>(EmptyBudget)

	useEffect(() => {
		const FetchBudget = async () => {
			const response = await getBudget(date)
			if (!response) return
			setBudget(response)
		}

		FetchBudget()
	}, [date, getBudget])

	return budget
}

/**
 * Budget provider that provides the budget context to all children
 * Example to access functions:
 * const budgetContext = useContext(BudgetContext)
 * const { UpdateCategory } = budgetContext
 */
export const BudgetProvider = (props: BudgetProviderProps) => {
	const { getBudget } = useBudgets()

	const [budget, setBudget] = useState<Budget>(EmptyBudget)

	const GetBudget = async (date: Date): Promise<Budget> => {
		const response = await getBudget(date)
		const budget = response
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
