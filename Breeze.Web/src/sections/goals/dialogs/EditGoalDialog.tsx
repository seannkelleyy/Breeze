import { Button } from '../../../components/ui/button'
import { DialogHeader, DialogFooter, Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger } from '../../../components/ui/dialog'
import { Input } from '../../../components/ui/input'
import { useState } from 'react'
import { useMsal } from '@azure/msal-react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Form, FormControl, FormField, FormItem, FormLabel } from '../../../components/ui/form'
import { Goal } from '../../../services/hooks/goal/goalServices'
import { usePatchGoal } from '../../../services/hooks/goal/usePatchGoal'
import { useDeleteGoal } from '../../../services/hooks/goal/useDeleteGoal'
import { Pencil } from 'lucide-react'
import { DeleteConfirmationDialog } from '../../../components/reusable/DeleteConfirmationDialog'

type GoalItemDialogProps = {
	goal: Goal
	refetchGoals: () => void
}

export const EditGoalDialog = ({ goal, refetchGoals }: GoalItemDialogProps) => {
	const account = useMsal().accounts[0]
	const [open, setOpen] = useState(false)

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
								<DeleteConfirmationDialog
									itemType='goal'
									onDelete={() => deleteMutation.mutate({ userId: account.homeAccountId, goalId: goal.id! })}
									additionalText={<p className='text-center'>Goal: {goal.description}</p>}
								/>
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
		</>
	)
}

