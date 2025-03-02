import { useState } from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, useForm } from 'react-hook-form'
import { Goal } from '../../../services/hooks/goal/goalServices'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog'
import { useMsal } from '@azure/msal-react'
import { Pencil, Trash } from 'lucide-react'
import { ConfirmationModal } from '../../../components/reusable/ConfirmationModal'
import { Button } from '../../../components/ui/button'
import { FormField, FormItem, FormLabel, FormControl } from '../../../components/ui/form'
import { Input } from '../../../components/ui/input'
import { useDeleteGoal } from '../../../services/hooks/goal/useDeleteGoal'
import { usePatchGoal } from '../../../services/hooks/goal/usePatchGoal'

type GoalItemDialogProps = {
	goal: Goal
	refetchGoals: () => void
}

export const EditGoalDialog = ({ goal, refetchGoals }: GoalItemDialogProps) => {
	const account = useMsal().accounts[0]
	const [open, setOpen] = useState(false)
	const [deleteOpen, setDeleteOpen] = useState(false)

	const formSchema = z.object({
		description: z.string().min(1, {
			message: 'Description is required',
		}),
		isCompleted: z.boolean(),
	})

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: goal,
	})

	const updateGoalMutation = usePatchGoal({
		onSettled: () => {
			refetchGoals()
			setOpen(false)
		},
	})

	const deleteMutation = useDeleteGoal({
		onSettled: () => refetchGoals(),
	})

	const onSubmit = (values: z.infer<typeof formSchema>) => {
		const goalToUpdate = {
			...goal,
			description: values.description,
			isCompleted: values.isCompleted,
		}
		updateGoalMutation.mutate({ userId: account.homeAccountId, goal: goalToUpdate })
	}

	return (
		<>
			<Dialog
				open={open}
				onOpenChange={setOpen}
			>
				<DialogTrigger onClick={() => setOpen(true)}>
					<Pencil />
				</DialogTrigger>
				<DialogContent>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)}>
							<DialogHeader>
								<DialogTitle>Edit Goal</DialogTitle>
								<DialogDescription>Make changes to your goal here. Click 'Save Changes' when you’re done.</DialogDescription>
							</DialogHeader>
							<FormField
								control={form.control}
								name='description'
								render={({ field }) => (
									<FormItem className='grid grid-cols-4 items-center gap-2'>
										<FormLabel className='text-right'>Goal Description</FormLabel>
										<FormControl>
											<Input
												id='description'
												type='text'
												{...field}
												className='col-span-3'
											/>
										</FormControl>
									</FormItem>
								)}
							/>
							<DialogFooter className='flex justify-between items-center w-full'>
								<Button
									variant='destructive'
									onClick={() => setDeleteOpen(true)}
								>
									<Trash />
								</Button>
								<FormField
									control={form.control}
									name='isCompleted'
									render={({ field }) => (
										<FormItem className='flex items-center gap-2 py-4'>
											<FormControl>
												<Button
													type='button'
													variant={field.value ? 'default' : 'outline'}
													onClick={() => field.onChange(!field.value)}
												>
													{field.value ? 'Mark as Incomplete' : 'Mark as Complete'}
												</Button>
											</FormControl>
										</FormItem>
									)}
								/>
								<Button type='submit'>Save Changes</Button>
							</DialogFooter>
						</form>
					</Form>
				</DialogContent>
			</Dialog>
			<ConfirmationModal
				itemType='goal'
				open={deleteOpen}
				onOpenChange={setDeleteOpen}
				onDelete={() => deleteMutation.mutate({ userId: account.homeAccountId, goalId: goal.id! })}
			/>
		</>
	)
}

