import { useMsal } from '@azure/msal-react'
import { useFetchGoals } from '../../services/hooks/goal/useFetchGoals'
import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { GoalItem } from './GoalItem'
import { usePatchGoal } from '../../services/hooks/goal/usePatchGoal'
const testGoals = [
	{ id: 1, description: 'Pay off house', isCompleted: true, userId: '1' },
	{ id: 2, description: 'Pay off car', isCompleted: false, userId: '1' },
	{ id: 3, description: 'Fund emergency fund', isCompleted: true, userId: '1' },
]

export const Goals = () => {
	const account = useMsal().accounts[0]
	const { data: goals, refetch, isLoading, isError } = useFetchGoals({ userId: account?.homeAccountId ?? '' })
	const patchMutation = usePatchGoal({
		onSettled: () => refetch(),
	})

	// if (isLoading) return <div>Loading...</div>

	// if (isError) return <div>Error fetching goals</div>

	// put incomplete goals at top
	const fakeGoals = testGoals?.sort((a, b) => (a.isCompleted === b.isCompleted ? 0 : a.isCompleted ? 1 : -1))

	return (
		<section title='Goals' className='space-y-4 w-3/4 flex flex-col items-evenly'>
			<div className='flex justify-between items-center'>
				<h1 className='text-2xl font-bold'>Goals</h1>
			</div>
			<ul>
				{fakeGoals?.map((goal) => (
					<GoalItem
						key={goal.id}
						goal={goal}
						refetchGoals={refetch}
						userId={account?.homeAccountId ?? ''}
					/>
				))}
			</ul>
			<Button
				onClick={() =>
					goals?.map((goal) => {
						patchMutation.mutate({ userId: account?.homeAccountId ?? '', goal: goal })
					})
				}
			>
				Save
			</Button>
		</section>
	)
}

