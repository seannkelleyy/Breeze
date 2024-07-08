import React, { useState, useContext, useEffect, useMemo } from 'react'
import { useFetchBudget } from '../hooks/budget/useFetchBudget'
import { useFetchIncomes } from '../hooks/income/useFetchIncomes'
import { Budget } from '../hooks/budget/budgetServices'
import { Category } from '../hooks/category/categoryServices'
import { Income } from '../hooks/income/incomeServices'
import { useFetchCategories } from '../hooks/category/useFetchCategories'
import dayjs, { Dayjs } from 'dayjs'

type BudgetProviderProps = { children: React.ReactNode }
type BudgetContextType = {
	budget: Budget
	totalSpent: number
	incomes: Income[]
	categories: Category[]
	getBudgetForDate: (year: number, month: number) => Promise<{ status: number; budget?: Budget; error?: string }>
	refetchBudget: () => void
	refetchIncomes: () => void
	refetchCategories: () => void
}

const BudgetContext = React.createContext<BudgetContextType>({} as BudgetContextType)

export const BudgetProvider: React.FC<BudgetProviderProps> = ({ children }) => {
	const [totalSpent, setTotalSpent] = useState(0)
	const [budgetDate, setBudgetDate] = useState<Dayjs>(dayjs(new Date()))
	const { data: budget = {} as Budget, refetch: refetchBudget } = useFetchBudget({ date: budgetDate })
	const { data: incomes = [], refetch: refetchIncomes } = useFetchIncomes({ budgetId: budget?.id, enabled: !!budget.id })
	const { data: categories = [], refetch: refetchCategories } = useFetchCategories({ budgetId: budget?.id, enabled: !!budget.id })

	const sortedCategories = useMemo(() => {
		return [...categories].sort((a, b) => b.currentSpend - a.currentSpend)
	}, [categories])

	useEffect(() => {
		setTotalSpent(categories.reduce((sum, category) => sum + category.currentSpend, 0))
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [sortedCategories])

	const getBudgetForDate = async (year: number, month: number) => {
		try {
			setBudgetDate(dayjs().year(year).month(month))
			await refetchBudget()
			await refetchIncomes()
			await refetchCategories()
			if (!budget) {
				throw new Error('No budget found')
			}
			return { status: 200, budget }
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (error: any) {
			console.error('An error occurred while fetching the budget:', error)
			if (error.message === 'No budget found') {
				return { status: 404, error: 'No budget found' }
			}
			return { status: 500, error: 'A server error occurred' }
		}
	}
	return (
		<BudgetContext.Provider value={{ budget, totalSpent, incomes, categories, getBudgetForDate, refetchBudget, refetchIncomes, refetchCategories }}>
			{children}
		</BudgetContext.Provider>
	)
}

// eslint-disable-next-line react-refresh/only-export-components
export const useBudgetContext = () => useContext(BudgetContext)
