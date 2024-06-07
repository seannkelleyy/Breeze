import React, { useState, useContext } from 'react'
import { Budget, useBudgets } from '../hooks/BudgetServices'
import { useAuth0 } from '@auth0/auth0-react'

type BudgetProviderProps = { children: React.ReactNode }
type BudgetContextType = { budget: Budget; totalSpent: number; getBudgetForDate: (date: Date) => Promise<Budget> }

// Context creation with default value
const BudgetContext = React.createContext<BudgetContextType>({} as BudgetContextType)

// Context provider component
export const BudgetProvider: React.FC<BudgetProviderProps> = ({ children }) => {
	const { user } = useAuth0()
	const { getBudget, postBudget } = useBudgets()
	const [budget, setBudget] = useState<Budget>({} as Budget)
	const totalSpent = budget.categories ? budget.categories.reduce((sum, category) => sum + category.currentSpend, 0) : 0

	const getBudgetForDate = async (date: Date) => {
		try {
			const response = await getBudget(date)
			if (response) setBudget(response)
			else {
				const newBudget: Budget = {
					id: 0,
					userId: user?.email ?? '',
					monthlyIncome: 0,
					monthlyExpenses: 0,
					year: date.getFullYear(),
					month: date.getMonth() + 1,
					categories: [],
					incomes: [],
				}
				await postBudget(newBudget)
				setBudget(newBudget)
			}
		} catch (error: Error | unknown) {
			console.error('An error occurred while fetching the budget:', error)
		}
		return budget
	}
	return <BudgetContext.Provider value={{ budget, totalSpent, getBudgetForDate }}>{children}</BudgetContext.Provider>
}

// Hook to access the context
// eslint-disable-next-line react-refresh/only-export-components
export const useBudgetContext = () => useContext(BudgetContext)
