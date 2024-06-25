import { BreezeBox } from '@/components/shared/BreezeBox'
import { BreezeButton } from '@/components/shared/BreezeButton'
import { BreezeInput } from '@/components/shared/BreezeInput'
import { BreezeText } from '@/components/shared/BreezeText'
import { DeleteButton } from '@/components/shared/DeleteButton'
import { Goal } from '@/services/hooks/goal/GoalServices'
import { useDeleteGoal } from '@/services/hooks/goal/useDeleteGoal'
import { usePatchGoal } from '@/services/hooks/goal/usePatchGoal'

type GoalItemProps = {
	userId: string
	goal: Goal
	isEditMode: boolean
	refetchGoals: () => void
}

/**
 * This component is a single goal item. It is displayed in the GoalItemsBox component.
 * @param userId. The user's id.
 * @param goal. The goal object.
 * @param isEditMode. A boolean to indicate if the goal is in edit mode.
 * @param refetchGoals. A function to refetch the goals.
 */
export const GoalItem = ({ userId, goal, isEditMode, refetchGoals }: GoalItemProps) => {
	const deleteMutation = useDeleteGoal({
		userId: userId,
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		goalId: goal.id!,
	})
	const patchMutation = usePatchGoal({
		userId: userId,
		goal: goal,
		onSuccess: () => {
			refetchGoals()
		},
	})
	return (
		<BreezeBox
			title='Goal'
			style={{
				width: '100%',
				flexDirection: 'row',
				padding: '.5em 0',
			}}
		>
			{isEditMode ? (
				<>
					<BreezeInput
						type='text'
						title='Goal'
						placeholder='Enter goal'
						defaultValue={goal.description}
						selectAllOnClick
						onChange={(e) => {
							goal.description = e.target.value
						}}
						onBlur={() => patchMutation.mutate()}
						style={{
							width: '100%',
							textAlign: 'center',
							backgroundColor: 'var(--color-input-background)',
						}}
					/>
					<BreezeButton
						content={
							<img
								className='svg-icon'
								src={goal.isCompleted ? '/complete.svg' : '/incomplete.svg'}
								alt={goal.isCompleted ? 'complete' : 'incomplete'}
								width={24}
								height={24}
							/>
						}
						onClick={() => {
							goal.isCompleted = !goal.isCompleted
							patchMutation.mutate()
						}}
						style={{
							padding: '0',
							margin: '0',
							backgroundColor: 'transparent',
							boxShadow: 'none',
						}}
					/>
					<DeleteButton
						onClick={() => {
							deleteMutation.mutate()
							refetchGoals()
						}}
					/>
				</>
			) : (
				<>
					<BreezeText
						text={goal.description}
						type='medium'
						style={goal.isCompleted ? { textDecoration: 'line-through' } : {}}
					/>
				</>
			)}
		</BreezeBox>
	)
}
