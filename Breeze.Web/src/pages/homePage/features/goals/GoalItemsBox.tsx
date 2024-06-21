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
	const { data: goals, refetch, isLoading, isError } = useFetchGoals({ userId: user?.sub ?? '' })
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
			<BreezeButton
				content={
					<img
						src='/edit.svg'
						alt='edit'
					/>
				}
				onClick={() => setIsEditMode(!isEditMode)}
				style={{
					position: 'absolute',
					top: '7.5%',
					right: '7.5%',
					padding: '0',
					margin: '0',
					backgroundColor: 'transparent',
					boxShadow: 'none',
				}}
			/>
			{goals ? (
				<BreezeList>
					{goals.map((goal: Goal) => (
						<GoalItem
							key={goal.id}
							userId={user?.sub ?? ''}
							goal={goal}
							isEditMode={isEditMode}
							refetchGoals={refetch}
						/>
					))}
				</BreezeList>
			) : isLoading ? (
				<BreezeText
					type='medium'
					text='Loading...'
				/>
			) : (
				isError && (
					<BreezeText
						type='medium'
						text='Error fetching goals'
					/>
				)
			)}
			<BreezeButton
				content='Add Goal'
				onClick={() => postMutate.mutate()}
			/>
		</BreezeCard>
	)
}
