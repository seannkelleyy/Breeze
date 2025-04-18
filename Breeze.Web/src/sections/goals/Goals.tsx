import { useFetchGoals } from '../../services/hooks/goal/useFetchGoals'
import { Card } from '../../components/ui/card'
import { GoalDialog } from './GoalDialog'

export const Goals = () => {
	const { data: goals, refetch, isLoading, isError } = useFetchGoals({ userId: '' })

	if (goals) goals.sort((a, b) => (a.isCompleted === b.isCompleted ? 0 : a.isCompleted ? 1 : -1))

	return (
		<Card className='space-y-4 w-3/4 flex flex-col items-evenly p-4 my-4'>
			<div className='flex justify-between items-center'>
				<h1 className='text-2xl font-bold'>Goals</h1>
			</div>
			<ul className='space-y-2'>
				{goals ? (
					goals.map((goal) => (
						<li
							className='flex gap-2 items-center justify-between w-3/4 ml-auto mr-auto'
							key={goal.id}
						>
							<p className='text-xl'>{goal.isCompleted ? <del>{goal.description}</del> : goal.description}</p>
							<GoalDialog
								goal={goal}
								refetchGoals={refetch}
							/>
						</li>
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

