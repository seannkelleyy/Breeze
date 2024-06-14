import React, { useState, useContext, useEffect } from 'react'
import { Budget, useBudgets } from '../hooks/BudgetServices'
import { Category, useCategories } from '../hooks/CategoryServices'
import { useDateContext } from './DateProvider'
import { useQuery } from 'react-query'
import { Income, useIncomes } from '../hooks/IncomeServices'
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
	const { getBudget } = useBudgets()
	const { getCategories } = useCategories()
	const { getIncomes } = useIncomes()
	const [totalSpent, setTotalSpent] = useState(0)
	const [budgetDate, setBudgetDate] = useState<Date>(date)
	const { data: fetchedBudget, refetch: refetchBudget } = useQuery(['budget', budgetDate], () => getBudget(budgetDate.getFullYear(), budgetDate.getMonth()), {
		refetchInterval: 30 * 1000,
		refetchOnMount: 'always',
		enabled: true,
	})
	const [budget, setBudget] = useState<Budget>(fetchedBudget ?? ({} as Budget))

	useEffect(() => {
		if (fetchedBudget) {
			setBudget(fetchedBudget)
		}
	}, [fetchedBudget])
	const { data: incomes = [], refetch: refetchIncomes } = useQuery(['incomes', fetchedBudget], () => getIncomes(fetchedBudget?.id ?? 0), {
		refetchInterval: 30 * 1000,
		refetchOnMount: 'always',
		enabled: !!fetchedBudget,
	})
	const { data: categories = [], refetch: refetchCategories } = useQuery(['categories', fetchedBudget], () => getCategories(fetchedBudget?.id ?? 0), {
		onSuccess: () => {
			categories.sort((a, b) => b.currentSpend - a.currentSpend)
			calculateTotalSpent()
		},
		refetchInterval: 30 * 1000,
		refetchOnMount: 'always',
		enabled: !!fetchedBudget,
	})

	const calculateTotalSpent = () => {
		const total = categories.reduce((sum, category) => sum + category.currentSpend, 0)
		setTotalSpent(total)
	}

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
