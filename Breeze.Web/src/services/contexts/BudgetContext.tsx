import React, { useEffect, useState, useContext } from 'react'
import { Budget, useBudgets } from '../hooks/BudgetServices'
import { useAuth0 } from '@auth0/auth0-react'

type BudgetProviderProps = { children: React.ReactNode }
type BudgetContextType = { budget: Budget; getBudgetForDate: (date: Date) => Promise<Budget> }

// Context creation with default value
const BudgetContext = React.createContext<BudgetContextType>({} as BudgetContextType)

// Custom hook to access budget data
// eslint-disable-next-line react-refresh/only-export-components
export const useBudget = (date: Date) => {
	const { user } = useAuth0()
	const { getBudget } = useBudgets()
	const [budget, setBudget] = useState<Budget>({
		id: 0,
		userEmail: user?.email ?? '',
		monthlyIncome: 0,
		monthlyExpenses: 0,
		year: date.getFullYear(),
		month: date.getMonth() + 1,
		categories: [],
		incomes: [],
	})

	useEffect(() => {
		const fetchBudget = async () => {
			const response = await getBudget(date)
			if (response) setBudget(response)
		}
		fetchBudget()
	}, [date, getBudget])

	return budget
}

// Context provider component
export const BudgetProvider: React.FC<BudgetProviderProps> = ({ children }) => {
	const { getBudget } = useBudgets()
	const [budget, setBudget] = useState<Budget>({} as Budget)

	const getBudgetForDate = async (date: Date) => {
		const response = await getBudget(date)
		setBudget(response || ({} as Budget))
		return response || ({} as Budget)
	}

	return <BudgetContext.Provider value={{ budget, getBudgetForDate }}>{children}</BudgetContext.Provider>
}

// Hook to access the context
// eslint-disable-next-line react-refresh/only-export-components
export const useBudgetContext = () => useContext(BudgetContext)
