import { Goal } from '../../services/hooks/goal/goalServices'
import { EditGoalDialog } from './dialogs/EditGoalDialog'

type GoalItemProps = {
	goal: Goal
	refetchGoals: () => void
}

export const GoalItem = ({ goal, refetchGoals }: GoalItemProps) => {
	return (
		<div className='flex gap-2 items-center justify-between w-3/4 ml-auto mr-auto'>
			<p className='text-xl'>{goal.isCompleted ? <del>{goal.description}</del> : goal.description}</p>
			<EditGoalDialog
				goal={goal}
				refetchGoals={refetchGoals}
			/>
		</div>
	)
}

