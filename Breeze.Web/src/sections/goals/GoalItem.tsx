import { Goal } from '../../services/hooks/goal/goalServices'
import { GoalDialog } from './GoalDialog'

type GoalItemProps = {
	goal: Goal
	refetchGoals: () => void
}

export const GoalItem = ({ goal, refetchGoals }: GoalItemProps) => {
	return (
		<div className='flex gap-2 items-center justify-between w-3/4 ml-auto mr-auto'>
			<p className='text-xl'>{goal.isCompleted ? <del>{goal.description}</del> : goal.description}</p>
			<GoalDialog
				goal={goal}
				refetchGoals={refetchGoals}
			/>
		</div>
	)
}

