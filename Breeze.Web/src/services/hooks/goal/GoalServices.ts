import useHttp from "../useHttp"

export type Goal = {
    id?: number,
    userId: string,
    description: string,
    isCompleted: boolean,
}

// Only getGoals, postGoal, patchGoal and deleteGoal are used in the app currently. Everything else is unused, but I'm keeping it because 
// I want to keep an example of this pattern in the codebase for reference.
export const useGoals = () => {
	const { getOne, getMany, post, patch, deleteOne } = useHttp()

	const getGoal = async ( userId: string, goalId: number): Promise<Goal> =>
		await getOne<Goal>(`users/${userId}/goals/${goalId}`)

	const getGoals = async (userId: string): Promise<Goal[]> => await getMany<Goal>(`users/${userId}/goals`)

	const postGoal = async (userId: string, goal: Goal): Promise<number> => post<number, Goal>(`users/${userId}/goals`, goal)

	const patchGoal = async (userId: string, goal: Goal): Promise<number> => patch<number, Goal>(`users/${userId}/goals`, goal)

	const deleteGoal = async (userId: string, goalId: number) => deleteOne<Goal>(`users/${userId}/goals/${goalId}`)

	return { getGoal, getGoals, postGoal, patchGoal, deleteGoal }
}
