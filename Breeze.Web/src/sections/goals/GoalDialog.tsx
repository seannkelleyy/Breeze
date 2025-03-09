import { useMsal } from '@azure/msal-react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { DeleteConfirmationDialog } from '../../components/reusable/DeleteConfirmationDialog'
import { Button } from '../../components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog'
import { FormField, FormItem, FormLabel, FormControl, Form } from '../../components/ui/form'
import { Input } from '../../components/ui/input'
import { Goal } from '../../services/hooks/goal/goalServices'
import { useDeleteGoal } from '../../services/hooks/goal/useDeleteGoal'
import { usePatchGoal } from '../../services/hooks/goal/usePatchGoal'
import { usePostGoal } from '../../services/hooks/goal/usePostGoal'

type GoalDialogProps = {
	goal?: Goal
	refetchGoals: () => void
}

export const GoalDialog = ({ goal, refetchGoals }: GoalDialogProps) => {
	const account = useMsal().accounts[0]
	const [open, setOpen] = useState(false)

	const isEditing = !!goal

	const formSchema = z.object({
		description: z.string().min(1, {
			message: 'Description is required',
		}),
		isCompleted: z.boolean().optional(),
	})

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: goal || { description: '', isCompleted: false },
	})

	const postGoalMutation = usePostGoal({
		onSettled: () => {
			refetchGoals()
			setOpen(false)
		},
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
		if (isEditing) {
			const goalToUpdate = {
				...goal,
				description: values.description,
				isCompleted: values.isCompleted ?? false,
			}
			updateGoalMutation.mutate({ userId: account.homeAccountId, goal: goalToUpdate })
		} else {
			postGoalMutation.mutate({
				userId: account.username,
				goal: {
					userId: account.username,
					description: values.description,
					isCompleted: false,
				},
			})
		}
	}

	return (
		<Dialog
			open={open}
			onOpenChange={setOpen}
		>
			{isEditing ? (
				<DialogTrigger onClick={() => setOpen(true)}>
					<Pencil />
				</DialogTrigger>
			) : (
				<Button
					className='w-fit self-center'
					onClick={() => setOpen(true)}
				>
					Create Goal
				</Button>
			)}
			<DialogContent>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className='space-y-2'
					>
						<DialogHeader>
							<DialogTitle>{isEditing ? 'Edit Goal' : 'Create Goal'}</DialogTitle>
							<DialogDescription>
								{isEditing ? 'Make changes to your goal here. Click "Save Changes" when you’re done.' : 'Create a new goal. Click save when you’re done.'}
							</DialogDescription>
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
							{isEditing && (
								<DeleteConfirmationDialog
									itemType='goal'
									onDelete={() => deleteMutation.mutate({ userId: account.homeAccountId, goalId: goal!.id! })}
									additionalText={<p className='text-center'>Goal: {goal!.description}</p>}
								/>
							)}
							{isEditing && (
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
							)}
							<Button type='submit'>{isEditing ? 'Save Changes' : 'Create Goal'}</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}

