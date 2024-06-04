import { Category } from './CategoryServices'
import { Income } from './IncomeServices'
import useHttp from './useHttp'

export type Budget = {
	id: number
	userId: string
	monthlyIncome: number
	monthlyExpenses: number
	year: number
	month: number
	categories: Category[]
	incomes: Income[]
}

export const useBudgets = () => {
	const { getOne, post, patch, deleteOne } = useHttp()

	const getBudget = async (date: Date): Promise<Budget> => await getOne<Budget>(`budgets/${date.getFullYear()}/${date.getMonth()}`)

	const postBudget = async (budget: Budget) => post<Budget, Budget>('budgets', budget)

	const patchBudget = async (budget: Budget) => patch<Budget, Budget>('budgets', budget)

	const deleteBudget = async (budgetId: number) => deleteOne<Budget>(`budgets/${budgetId}`)

	return { getBudget, postBudget, patchBudget, deleteBudget }
}
