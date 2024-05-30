import { Category, EmptyCategory } from './CategoryServices'
import { Income, EmptyIncome } from './IncomeServices'
import useHttp from './useHttp'

export type Budget = {
	id: number
	userId?: string
	date: Date
	monthlyIncome: number
	monthlyExpenses: number
	categories: Category[]
	incomes: Income[]
}

// This is used to initialize a new budget
// eslint-disable-next-line react-refresh/only-export-components
export const EmptyBudget: Budget = {
	id: 0,
	userId: '',
	date: new Date(),
	monthlyIncome: 0,
	monthlyExpenses: 0,
	categories: [EmptyCategory],
	incomes: [EmptyIncome],
}

export const useBudgets = () => {
	const { getOne, post, patch, deleteOne } = useHttp()

	const getBudget = async (date: Date): Promise<Budget> => await getOne<Budget>(`${date.getFullYear()}/${date.getMonth() + 1}`)

	const postBudget = async (budget: Budget) => post<Budget, Budget>('/budgets', budget)

	const patchBudget = async (budget: Budget) => patch<Budget, Budget>('/budgets', budget)

	const deleteBudget = async (budgetId: number) => deleteOne<Budget>(`/budgets/${budgetId}`)

	return { getBudget, postBudget, patchBudget, deleteBudget }
}
