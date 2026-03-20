import { Button } from '@/components/ui/button'
import { GoalSkeleton } from './GoalSkeleton'
import { CreateGoalDialog } from './dialogs/CreateGoalDialog'
import { EditGoalDialog } from './dialogs/EditGoalDialog'
import { useFetchGoals } from '../../hooks/goal/index'
import { Card } from '@/components/ui/card'
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider'

/**
 * Goals component for displaying a list of user goals.
 * @returns {JSX.Element} The Goals component that displays a list of user goals.
 */
export const Goals = () => {
	const { userId } = useCurrentUser()
	const { data: goals, refetch, isLoading, isError } = useFetchGoals({ userId })

	if (goals) goals.sort((a, b) => (a.isCompleted === b.isCompleted ? 0 : a.isCompleted ? 1 : -1))

	if (isLoading) return <GoalSkeleton />

	if (isError)
		return (
			<Card className='flex flex-col gap-4 justify-center items-center rounded-md p-4 my-4'>
				<p className='text-center'>Error Loading Goals</p>
				<Button onClick={() => refetch()}>Refetch Goals</Button>
			</Card>
		)

	if (!goals || goals.length === 0) {
		return (
			<Card className='space-y-4 flex flex-col items-evenly p-4 my-4 w-[80%] max-w-[95%] md:max-w-[400px] rounded-md'>
				<div className='flex justify-between items-center'>
					<h1 className='text-2xl font-bold'>Goals</h1>
				</div>
				<p className='text-center'>No goals found</p>
				<CreateGoalDialog refetchGoals={refetch} />
			</Card>
		)
	}

	return (
		<Card className='space-y-4 flex flex-col items-evenly p-4 my-4 w-[80%] max-w-[95%] md:max-w-[400px] rounded-md'>
			<div className='flex justify-between items-center'>
				<h1 className='text-2xl font-bold'>Goals</h1>
			</div>
			<ul className='space-y-2'>
				{goals.map((goal) => (
					<EditGoalDialog
						existingGoal={goal}
						refetchGoals={refetch}
						key={goal.id}
					>
						<li
							className='flex gap-16 items-center justify-center mx-auto hover:bg-accent p-2 rounded-md'
							key={goal.id}
						>
							<p className='text-xl'>{goal.isCompleted ? <del>{goal.description}</del> : goal.description}</p>
						</li>
					</EditGoalDialog>
				))}
			</ul>
			<CreateGoalDialog refetchGoals={refetch} />
		</Card>
	)
}

