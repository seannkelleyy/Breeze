import useHttp from '@/lib/services/useHttp'
import { Income } from '../../types/income'

/**
 * A hook for fetching income data. This should only be used when creating new hooks with ReactQuery.
 */
const useIncomes = () => {
	const { getMany, post, patch, deleteOne } = useHttp()

	const getIncomes = async (budgetId: number): Promise<Income[]> => await getMany<Income>(`budgets/${budgetId}/incomes`)

	const postIncome = async (budgetId: number, income: Income): Promise<number> => await post<number, Income>(`budgets/${budgetId}/incomes`, income)

	const patchIncome = async (income: Income): Promise<number> => patch<number, Income>(`budgets/${income.budgetId}/incomes`, income)

	const deleteIncome = async (income: Income) => deleteOne<Income>(`budgets/${income.budgetId}/incomes/${income.id}`)

	return { getIncomes, postIncome, patchIncome, deleteIncome }
}

export default useIncomes

