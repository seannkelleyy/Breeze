import useHttp from '@/lib/services/useHttp'
import { Budget } from '../../types/budget'

/**
 * A hook for regenerating recurring-template  rows for a given budget month.
 */
export const useRegenerateBudget = () => {
	const { post } = useHttp()

	const regenerateBudgetMonth = async (year: number, month: number): Promise<Budget> => await post<Budget, Record<string, never>>(`budgets/${year}-${month}/regenerate`, {})

	return { regenerateBudgetMonth }
}

export default useRegenerateBudget

