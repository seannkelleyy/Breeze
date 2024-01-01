/* eslint-disable react-refresh/only-export-components */
import React, { useContext, useEffect, useState } from 'react'
import { Budget, emptyBudget } from '../../../models/budget'
import { GetBudget } from '../../../services/BudgetServices'
import { GetExpenses } from '../../../services/ExpenseServices'
import { GetCategories } from '../../../services/CategoryServices'
import { GetIncomes } from '../../../services/IncomeServices'
import { Category } from '../../../models/category'
import { Expense } from '../../../models/expense'
import { Income } from '../../../models/income'

// /* eslint-disable react-refresh/only-export-components */
// import React, { useContext, useState } from 'react'
// import { Budget, emptyBudget } from '../../../models/budget'

// type BudgetProviderProps = {
// 	children: React.ReactNode[] | React.ReactNode
// }

// const BudgetContext = React.createContext(emptyBudget)

// export const useBudget = () => useContext(BudgetContext)

// export const BudgetProvider = (props: BudgetProviderProps) => {
// 	const [budget, setBudget] = useState<Budget>(emptyBudget)

// 	return <BudgetContext.Provider value={budget}>{props.children}</BudgetContext.Provider>
// }

const BudgetsContext = React.createContext(emptyBudget)

export const useBudget = () => {
	return useContext(BudgetsContext)
}

export const BudgetsProvider = (children: React.ReactNode[] | React.ReactNode, date: Date) => {
	const [budget, setBudget] = useState<Budget | null>(null)
	const [categories, setCategories] = useState<Category[] | null>(null)
	const [expenses, setExpenses] = useState<Expense[] | null>(null)
	const [incomes, setIncomes] = useState<Income[] | null>(null)

	// These useEffects are for fetching data from the database
	useEffect(() => {
		const fetchBudget = async () => {
			const result = await GetBudget(date)
			setBudget(result)
		}

		fetchBudget()
	}, [date])

	useEffect(() => {
		const fetchExpenses = async () => {
			if (budget) {
				const result = await GetExpenses(budget?.id)
				setExpenses(result)
			} else {
				setExpenses(null)
			}
		}

		fetchExpenses()
	}, [budget])

	useEffect(() => {
		const fetchIncomes = async () => {
			if (budget) {
				const result = await GetIncomes(budget?.id)
				setIncomes(result)
			} else {
				setIncomes(null)
			}
		}

		fetchIncomes()
	}, [budget])

	const getBudgetCategories = (budgetId: number) => {
		return GetCategories(budgetId)
	}

	const getBudgetIncomes = (budgetId: number) => {
		return incomes.filter((income) => income.budgetId === budgetId)
	}

	const addExpense = ({ description, amount, budgetId }) => {
		setExpenses((prevExpenses) => {
			return [...prevExpenses, { id: uuidV4(), description, amount, budgetId }]
		})
	}
	const addBudget = ({ name, max }) => {
		setBudgets((prevBudgets) => {
			if (prevBudgets.find((budget) => budget.name === name)) {
				return prevBudgets
			}
			return [...prevBudgets, { id: uuidV4(), name, max }]
		})
	}
	const deleteBudget = ({ id }) => {
		setExpenses((prevExpenses) => {
			return prevExpenses.map((expense) => {
				if (expense.budgetId !== id) return expense
				return { ...expense, budgetId: UNCATEGORIZED_BUDGET_ID }
			})
		})

		setBudgets((prevBudgets) => {
			return prevBudgets.filter((budget) => budget.id !== id)
		})
	}
	const deleteExpense = ({ id }) => {
		setExpenses((prevExpenses) => {
			return prevExpenses.filter((expense) => expense.id !== id)
		})
	}

	return (
		<BudgetsContext.Provider
			value={{
				budget,
				getBudgetCategories,
				expenses,
				getBudgetExpenses,
				addExpense,
				addBudget,
				deleteBudget,
				deleteExpense,
			}}
		>
			{children}
		</BudgetsContext.Provider>
	)
}
