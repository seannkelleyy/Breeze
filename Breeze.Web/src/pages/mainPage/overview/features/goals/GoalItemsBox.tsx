import { useAuth0 } from '@auth0/auth0-react'
import { BreezeCard } from '../../../../../components/shared/BreezeCard'
import { BreezeList } from '../../../../../components/shared/BreezeList'
import { BreezeText } from '../../../../../components/shared/BreezeText'
import { useFetchGoals } from '@/services/hooks/goal/useFetchGoals'
import { Goal } from '@/services/hooks/goal/goalServices'
import { GoalItem } from './GoalItem'
import { BreezeButton } from '@/components/shared/BreezeButton'
import { usePostGoal } from '@/services/hooks/goal/usePostGoal'
import { useState } from 'react'
import { LoadingEffect } from '@/components/shared/LoadingEffect'
import { EditButton } from '@/components/shared/EditButton'

/**
 * This is a component that displays the user's goals.
 */
export const GoalItemsBox = () => {
	const { user } = useAuth0()
	const [isEditMode, setIsEditMode] = useState<boolean>(false)
	const [showCompleted, setShowCompleted] = useState<boolean>(false)
	const { data: goals, refetch, isLoading, isError } = useFetchGoals({ userId: user?.sub ?? '' })
	const unfinishedGoals = goals && goals?.filter((goal: Goal) => goal.isCompleted === false)
	const completedGoals = goals && goals?.filter((goal: Goal) => goal.isCompleted === true)

	const postMutate = usePostGoal({
		onSettled: () => refetch(),
	})

	if (isLoading)
		return (
			<BreezeCard title='Goals'>
				<BreezeText
					text='Goals'
					type='small-heading'
				/>
				<LoadingEffect />
			</BreezeCard>
		)

	if (isError)
		return (
			<BreezeCard title='Goals'>
				<BreezeText
					text='Goals'
					type='small-heading'
				/>
				<BreezeText
					type='medium'
					text='Error fetching goals'
				/>
			</BreezeCard>
		)

	return (
		<BreezeCard title='Goals'>
			<BreezeText
				text='Goals'
				type='small-heading'
			/>
			<EditButton
				onClick={() => setIsEditMode(!isEditMode)}
				style={{
					position: 'absolute',
					top: '1.25em',
					right: '1.25em',
				}}
			/>
			<BreezeButton
				content={showCompleted ? 'Hide Completed Goals' : 'Show Completed Goals'}
				onClick={() => setShowCompleted(!showCompleted)}
			/>

			<BreezeList>
				{unfinishedGoals &&
					unfinishedGoals.map((goal: Goal) => (
						<GoalItem
							key={goal.id}
							userId={user?.sub ?? ''}
							goal={goal}
							isEditMode={isEditMode}
							refetchGoals={refetch}
						/>
					))}
			</BreezeList>
			{showCompleted && (
				<BreezeList>
					{completedGoals &&
						completedGoals?.map((goal: Goal) => (
							<GoalItem
								key={goal.id}
								userId={user?.sub ?? ''}
								goal={goal}
								isEditMode={isEditMode}
								refetchGoals={refetch}
							/>
						))}
				</BreezeList>
			)}
			<BreezeButton
				content='Add Goal'
				onClick={() =>
					postMutate.mutate({
						userId: user?.sub ?? '',
						goal: {
							userId: user?.sub ?? '',
							description: 'New Goal',
							isCompleted: false,
						},
					})
				}
			/>
		</BreezeCard>
	)
}
