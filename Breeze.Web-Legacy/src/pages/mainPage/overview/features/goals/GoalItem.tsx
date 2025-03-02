import { BreezeBox } from '@/components/shared/BreezeBox'
import { BreezeButton } from '@/components/shared/BreezeButton'
import { BreezeInput } from '@/components/shared/BreezeInput'
import { BreezeText } from '@/components/shared/BreezeText'
import { DeleteButton } from '@/components/shared/DeleteButton'
import { Goal } from '@/services/hooks/goal/goalServices'
import { useDeleteGoal } from '@/services/hooks/goal/useDeleteGoal'
import { usePatchGoal } from '@/services/hooks/goal/usePatchGoal'
import { Square, SquareCheckBig } from 'lucide-react'

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
	const patchMutation = usePatchGoal({
		onSettled: () => refetchGoals(),
	})
	const deleteMutation = useDeleteGoal({
		onSettled: () => refetchGoals(),
	})

	if (!isEditMode)
		return (
			<BreezeBox
				title='Goal'
				style={{
					width: '100%',
					flexDirection: 'row',
					padding: '.5em 0',
				}}
			>
				{' '}
				<>
					<BreezeText
						text={goal.description}
						type='medium'
						style={goal.isCompleted ? { textDecoration: 'line-through' } : {}}
					/>
				</>
			</BreezeBox>
		)

	return (
		<BreezeBox
			title='Goal'
			style={{
				width: '100%',
				flexDirection: 'row',
				padding: '.5em 0',
			}}
		>
			<BreezeInput
				type='text'
				title='Goal'
				placeholder='Enter goal'
				defaultValue={goal.description}
				selectAllOnClick
				onChange={(e) => {
					goal.description = e.target.value
				}}
				onBlur={() =>
					patchMutation.mutate({
						userId: userId,
						goal: goal,
					})
				}
				style={{
					width: '100%',
					textAlign: 'center',
					backgroundColor: 'var(--color-input-background)',
				}}
			/>
			<BreezeButton
				content={goal.isCompleted ? <SquareCheckBig /> : <Square />}
				onClick={() => {
					goal.isCompleted = !goal.isCompleted
					patchMutation.mutate({ userId: userId, goal: goal })
				}}
				style={{
					padding: '0',
					margin: '0',
					backgroundColor: 'transparent',
					boxShadow: 'none',
				}}
			/>
			<DeleteButton
				onClick={() =>
					deleteMutation.mutate({
						userId: userId,
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
						goalId: goal.id!,
					})
				}
			/>
		</BreezeBox>
	)
}
