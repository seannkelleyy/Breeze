import { Check, Pencil, Save, Square, SquareCheckBig, Trash } from 'lucide-react'
import { Input } from '../../components/ui/input'
import { Goal } from '../../services/hooks/goal/goalServices'
import { Button } from '../../components/ui/button'
import { useDeleteGoal } from '../../services/hooks/goal/useDeleteGoal'
import { useState } from 'react'

type GoalItemProps = {
	userId: string
	goal: Goal
	refetchGoals: () => void
}

export const GoalItem = ({ userId, goal, refetchGoals }: GoalItemProps) => {
	const [isEditMode, setIsEditMode] = useState<boolean>(false)
	const deleteMutation = useDeleteGoal({
		onSettled: () => refetchGoals(),
	})

	if (!isEditMode)
		return (
			<div className='flex gap-2 items-center justify-between w-3/4 ml-auto mr-auto'>
				<p className='text-xl'>{goal.isCompleted ? <del>{goal.description}</del> : goal.description}</p>
				<Button
					variant='ghost'
					onClick={() => setIsEditMode(true)}
				>
					<Pencil />
				</Button>
			</div>
		)

	return (
		<li key={goal.id}>
			<div className='flex gap-2'>
				<Input
					value={goal.description}
					title='Goal description'
					onChange={(e) => (goal.description = e.target.value)}
				/>
				<Button
					variant='ghost'
					onClick={() => (goal.isCompleted = !goal.isCompleted)}
					title={goal.isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
				>
					{goal.isCompleted ? <SquareCheckBig /> : <Square />}
				</Button>
				<Button
					variant='ghost'
					title='Save'
					onClick={() => setIsEditMode(false)}
				>
					<Save />
				</Button>
				<Button
					variant='ghost'
					title='Delete'
					onClick={() => deleteMutation.mutate({ userId: userId, goalId: goal.id ?? -1 })}
				>
					<Trash />
				</Button>
			</div>
		</li>
	)
}

