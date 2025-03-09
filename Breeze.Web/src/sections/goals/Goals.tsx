import { useMsal } from '@azure/msal-react'
import { useFetchGoals } from '../../services/hooks/goal/useFetchGoals'
import { GoalItem } from './GoalItem'
import { Card } from '../../components/ui/card'
import { GoalDialog } from './GoalDialog'

export const Goals = () => {
	const account = useMsal().accounts[0]
	const { data: goals, refetch, isLoading, isError } = useFetchGoals({ userId: account?.homeAccountId ?? '' })

	if (goals) goals.sort((a, b) => (a.isCompleted === b.isCompleted ? 0 : a.isCompleted ? 1 : -1))

	return (
		<Card className='space-y-4 w-3/4 flex flex-col items-evenly p-4 my-4'>
			<div className='flex justify-between items-center'>
				<h1 className='text-2xl font-bold'>Goals</h1>
			</div>
			<ul className='space-y-2'>
				{goals ? (
					goals.map((goal) => (
						<GoalItem
							key={goal.id}
							goal={goal}
							refetchGoals={refetch}
						/>
					))
				) : isLoading ? (
					<li className='text-center'>Loading Goals...</li>
				) : isError ? (
					<li className='text-center'>Error Loading Goals</li>
				) : (
					<li className='text-center'>No goals found</li>
				)}
			</ul>
			<GoalDialog refetchGoals={refetch} />
		</Card>
	)
}

