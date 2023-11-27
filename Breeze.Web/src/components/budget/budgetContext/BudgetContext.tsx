/* eslint-disable react-refresh/only-export-components */
import React, { useContext, useState } from 'react'
import { Budget, emptyBudget } from '../../../models/budget'

const BudgetContext = React.createContext(emptyBudget)

const BudgetUpdateContext = React.createContext({})

export const useBudget = () => useContext(BudgetContext)
export const useBudgetUpdate = () => useContext(BudgetUpdateContext)

type BudgetProviderProps = {
	children: React.ReactNode[] | React.ReactNode
}
export const BudgetProvider = (props: BudgetProviderProps) => {
	const [budget, setBudget] = useState<Budget>({} as Budget)

	const updateBudget = (budget: Budget) => {
		setBudget(budget)
	}
	return (
		<BudgetContext.Provider value={budget}>
			<BudgetUpdateContext.Provider value={updateBudget}>{props.children}</BudgetUpdateContext.Provider>
		</BudgetContext.Provider>
	)
}
