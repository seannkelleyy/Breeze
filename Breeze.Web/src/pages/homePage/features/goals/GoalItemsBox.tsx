import { useAuth0 } from '@auth0/auth0-react'
import { BreezeCard } from '../../../../components/shared/BreezeCard'
import { BreezeList } from '../../../../components/shared/BreezeList'
import { BreezeText } from '../../../../components/shared/BreezeText'
import { useFetchGoals } from '@/services/hooks/goal/useFetchGoals'
import { Goal } from '@/services/hooks/goal/GoalServices'
import { GoalItem } from './GoalItem'
import { BreezeButton } from '@/components/shared/BreezeButton'
import { usePostGoal } from '@/services/hooks/goal/usePostGoal'
import { useState } from 'react'

/**
 * This is a future component that will display the user's goals.
 */
export const GoalItemsBox = () => {
	const { user } = useAuth0()
	const [isEditMode, setIsEditMode] = useState<boolean>(false)
	const [showCompleted, setShowCompleted] = useState<boolean>(false)
	const { data: goals, refetch, isLoading, isError } = useFetchGoals({ userId: user?.sub ?? '' })
	const unfinishedGoals = goals?.filter((goal: Goal) => goal.isCompleted === false)
	const completedGoals = goals?.filter((goal: Goal) => goal.isCompleted === true)

	const newGoal: Goal = {
		userId: user?.sub ?? '',
		description: 'New Goal',
		isCompleted: false,
	}
	const postMutate = usePostGoal({
		userId: user?.sub ?? '',
		goal: newGoal,
		onSettled: () => refetch(),
	})

	return (
		<BreezeCard
			title='Goals'
			style={{
				minWidth: '60%',
				maxWidth: '80%',
				position: 'relative',
			}}
		>
			<BreezeText
				text='Goals'
				type='small-heading'
			/>
			{isLoading ? (
				<BreezeText
					type='medium'
					text='Loading...'
				/>
			) : (
				<>
					<BreezeButton
						content={
							<img
								className='svg-icon'
								src='/edit.svg'
								alt='edit'
							/>
						}
						onClick={() => setIsEditMode(!isEditMode)}
						style={{
							position: 'absolute',
							top: '1.25em',
							right: '1.25em',
							padding: '0',
							margin: '0',
							backgroundColor: 'transparent',
							boxShadow: 'none',
						}}
					/>
					<BreezeButton
						content={showCompleted ? 'Hide Completed Goals' : 'Show Completed Goals'}
						onClick={() => setShowCompleted(!showCompleted)}
					/>
					{isError ? (
						<BreezeText
							type='medium'
							text='Error fetching goals'
						/>
					) : (
						<>
							<BreezeList>
								{unfinishedGoals?.map((goal: Goal) => (
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
									{completedGoals?.map((goal: Goal) => (
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
						</>
					)}
					<BreezeButton
						content='Add Goal'
						onClick={() => postMutate.mutate()}
					/>
				</>
			)}
		</BreezeCard>
	)
}
