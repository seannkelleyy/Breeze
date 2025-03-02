import { useMsal } from '@azure/msal-react'
import { useFetchGoals } from '../../services/hooks/goal/useFetchGoals'
import { GoalItem } from './GoalItem'
import { CreateGoalModal } from './CreateGoalModal'

export const Goals = () => {
	const account = useMsal().accounts[0]
	const { data: goals, refetch, isLoading, isError } = useFetchGoals({ userId: account?.homeAccountId ?? '' })

	if (isLoading) {
		console.log('loading')
	}

	if (isError) {
		console.log('error')
	}

	if (goals) goals.sort((a, b) => (a.isCompleted === b.isCompleted ? 0 : a.isCompleted ? 1 : -1))

	return (
		<section className='space-y-4 w-3/4 flex flex-col items-evenly'>
			<div className='flex justify-between items-center'>
				<h1 className='text-2xl font-bold'>Goals</h1>
			</div>
			<ul className='space-y-2'>
				{goals &&
					goals.map((goal) => (
						<GoalItem
							key={goal.id}
							goal={goal}
							refetchGoals={refetch}
						/>
					))}
			</ul>
			<CreateGoalModal refetchGoals={refetch} />
		</section>
	)
}

