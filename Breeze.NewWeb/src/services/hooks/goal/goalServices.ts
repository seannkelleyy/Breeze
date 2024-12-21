import useHttp from "../useHttp"

export type Goal = {
    id?: number,
    userId: string,
    description: string,
    isCompleted: boolean,
}

/**
 * A hook for fetching goal data. This should only be used when creating new hooks with ReactQuery.
 */
export const useGoals = () => {
	const { getMany, post, patch, deleteOne } = useHttp()

	const getGoals = async (userId: string): Promise<Goal[]> => await getMany<Goal>(`users/${userId}/goals`)

	const postGoal = async (userId: string, goal: Goal): Promise<number> => post<number, Goal>(`users/${userId}/goals`, goal)

	const patchGoal = async (userId: string, goal: Goal): Promise<number> => patch<number, Goal>(`users/${userId}/goals`, goal)

	const deleteGoal = async (userId: string, goalId: number) => deleteOne<Goal>(`users/${userId}/goals/${goalId}`)

	return {  getGoals, postGoal, patchGoal, deleteGoal }
}
