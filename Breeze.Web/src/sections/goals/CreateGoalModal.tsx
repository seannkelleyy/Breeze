import { useState } from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Goal } from '../../services/hooks/goal/goalServices'
import { useMsal } from '@azure/msal-react'
import { useForm } from 'react-hook-form'
import { usePostGoal } from '../../services/hooks/goal/usePostGoal'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog'
import { Button } from '../../components/ui/button'
import { FormField, FormItem, FormLabel, FormControl, Form } from '../../components/ui/form'
import { Input } from '../../components/ui/input'

type GoalModalProps = {
	existingGoal?: Goal
	refetchGoals: () => void
}

export const CreateGoalModal = ({ existingGoal, refetchGoals }: GoalModalProps) => {
	const [open, setOpen] = useState(false)
	const currentUserAccount = useMsal().accounts[0]

	const goal = existingGoal ?? {
		userId: currentUserAccount.username,
		description: '',
		isCompleted: false,
	}

	const formSchema = z.object({
		description: z.string().min(1, {
			message: 'Description is required',
		}),
	})

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: goal,
	})

	const onSubmit = (values: z.infer<typeof formSchema>) => {
		const goalToSubmit = {
			...values,
			userId: currentUserAccount.username,
			isCompleted: false,
		}
		postGoalMutation.mutate({ userId: currentUserAccount.username, goal: goalToSubmit })
	}

	const postGoalMutation = usePostGoal({
		onSettled: () => {
			refetchGoals()
			setOpen(false)
		},
	})

	return (
		<Dialog
			open={open}
			onOpenChange={setOpen}
		>
			<DialogTrigger onClick={() => setOpen(true)}>Create Goal</DialogTrigger>
			<DialogContent className='sm:max-w-[425px]'>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)}>
						<DialogHeader>
							<DialogTitle>{goal ? 'Edit Goal' : 'Create Goal'}</DialogTitle>
							<DialogDescription>{goal ? "Make changes to your goal here. Click save when you're done." : "Create a new goal. Click save when you're done."}</DialogDescription>
						</DialogHeader>
						<div className='grid gap-4 py-4'>
							<FormField
								control={form.control}
								name='description'
								render={({ field }) => (
									<FormItem className='grid grid-cols-4 items-center gap-4'>
										<FormLabel className='text-right'>Goal</FormLabel>
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
						</div>
						<DialogFooter>
							<Button type='submit'>{goal ? 'Save changes' : 'Create Goal'}</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}

