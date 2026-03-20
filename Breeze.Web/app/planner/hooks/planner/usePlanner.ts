import useHttp from '@/lib/services/useHttp'
import { PlannerResponse, PlannerUpsertRequest } from '../../types/planner'

const usePlanner = () => {
	const { getOne, put } = useHttp()

	const getPlanner = async (): Promise<PlannerResponse> => await getOne<PlannerResponse>('planner')
	const getLatestBudgetMonthlyExpenses = async (): Promise<number> => await getOne<number>('planner/latest-budget-expenses')

	const upsertPlanner = async (payload: PlannerUpsertRequest): Promise<number> => put<number, PlannerUpsertRequest>('planner', payload)

	return { getPlanner, getLatestBudgetMonthlyExpenses, upsertPlanner }
}

export default usePlanner

