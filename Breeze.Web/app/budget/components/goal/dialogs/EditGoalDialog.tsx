'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { BreezeFormDialog } from '../../../../../components/common/form/BreezeFormDialog'
import { FormInputField } from '../../../../../components/common/form/FormInputField'
import { Goal, goalFormSchema } from '@/app/budget/types/goal'
import { useDeleteGoal, usePatchGoal } from '@/app/budget/hooks/goal/index'
import { Button } from '@/components/ui/button'
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider'
import DeleteDialog from '@/components/common/dialog/DeleteDialog'

interface EditGoalDialogProps {
	existingGoal: Goal
	refetchGoals: () => void
	children?: React.ReactNode
}

/**
 * Dialog component for editing an existing goal.
 * @param {Goal} existingGoal - The goal to be edited.
 * @param {() => void} refetchGoals - Function to refetch the list of goals after an update or deletion.
 * @param {React.ReactNode} children - Optional trigger element for the dialog.
 * @returns {JSX.Element} The EditGoalDialog component.
 */
export const EditGoalDialog = ({ existingGoal, refetchGoals, children }: EditGoalDialogProps) => {
	const { userId } = useCurrentUser()

	const form = useForm<Goal>({
		resolver: zodResolver(goalFormSchema),
		defaultValues: {
			...existingGoal,
			userId,
		},
	})

	const updateGoalMutation = usePatchGoal({
		onSettled: () => {
			refetchGoals()
		},
	})

	const deleteMutation = useDeleteGoal({
		onSettled: () => refetchGoals(),
	})

	const onSubmit = (values: Goal) => {
		const updatedGoal = {
			...existingGoal,
			userId,
			description: values.description,
			isCompleted: values.isCompleted ?? false,
		}
		updateGoalMutation.mutate({ goal: updatedGoal })
	}

	const dialogTrigger = <div className='hover:cursor-pointer'>{children}</div>

	const inputFields = (
		<>
			<FormInputField
				form={form}
				name='description'
				label='Goal Description'
				placeholder='Edit your goal'
			/>
			<Button
				type='button'
				variant={form.watch('isCompleted') ? 'default' : 'outline'}
				onClick={() => form.setValue('isCompleted', !form.watch('isCompleted'))}
			>
				{form.watch('isCompleted') ? 'Mark as Incomplete' : 'Mark as Complete'}
			</Button>
		</>
	)

	return (
		<BreezeFormDialog
			dialogTrigger={dialogTrigger}
			itemType='Goal'
			title='Edit Goal'
			description="Make changes to your goal here. Click 'Save Changes' when you're done."
			form={form}
			onSubmit={onSubmit}
			inputFields={inputFields}
			destructiveElements={
				<DeleteDialog
					key={existingGoal.id}
					itemType='goal'
					onDelete={() => deleteMutation.mutate({ goal: existingGoal })}
					additionalText={<p className='text-center'>Goal: {existingGoal.description}</p>}
				/>
			}
		/>
	)
}

