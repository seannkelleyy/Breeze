import React, { useState, useContext, useEffect, useMemo } from 'react'
import { useDateContext } from './DateProvider'
import { useFetchBudget } from '../hooks/budget/useFetchBudget'
import { useFetchIncomes } from '../hooks/income/useFetchIncomes'
import { Budget } from '../hooks/httpServices/BudgetServices'
import { Category } from '../hooks/httpServices/CategoryServices'
import { Income } from '../hooks/httpServices/IncomeServices'
import { useFetchCategories } from '../hooks/category/useFetchCategories'
//import { useAuth0 } from '@auth0/auth0-react'

type BudgetProviderProps = { children: React.ReactNode }
type BudgetContextType = {
	budget: Budget
	totalSpent: number
	incomes: Income[]
	categories: Category[]
	getBudgetForDate: (year: number, month: number) => Promise<Budget>
	refetchBudget: () => void
	refetchIncomes: () => void
	refetchCategories: () => void
}

// Context creation with default value
const BudgetContext = React.createContext<BudgetContextType>({} as BudgetContextType)

// Context provider component
export const BudgetProvider: React.FC<BudgetProviderProps> = ({ children }) => {
	//const { user } = useAuth0()
	const { date } = useDateContext()
	const [totalSpent, setTotalSpent] = useState(0)
	const [budgetDate, setBudgetDate] = useState<Date>(date)
	const { data: budget = {} as Budget, refetch: refetchBudget } = useFetchBudget({ year: budgetDate.getFullYear(), month: budgetDate.getMonth() })
	const { data: incomes = [], refetch: refetchIncomes } = useFetchIncomes({ budgetId: budget?.id ?? 0 })
	const { data: categories = [], refetch: refetchCategories } = useFetchCategories({ budgetId: budget?.id ?? 0 })

	const sortedCategories = useMemo(() => {
		return [...categories].sort((a, b) => b.currentSpend - a.currentSpend)
	}, [categories])

	useEffect(() => {
		setTotalSpent(categories.reduce((sum, category) => sum + category.currentSpend, 0))
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [sortedCategories])

	const getBudgetForDate = async (year: number, month: number) => {
		try {
			setBudgetDate(new Date(year, month))
			refetchBudget()
			refetchIncomes()
			refetchCategories()
		} catch (error: Error | unknown) {
			console.error('An error occurred while fetching the budget:', error)
		}
		return budget
	}
	return (
		<BudgetContext.Provider value={{ budget, totalSpent, incomes, categories, getBudgetForDate, refetchBudget, refetchIncomes, refetchCategories }}>
			{children}
		</BudgetContext.Provider>
	)
}

// eslint-disable-next-line react-refresh/only-export-components
export const useBudgetContext = () => useContext(BudgetContext)
