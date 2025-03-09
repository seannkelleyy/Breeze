import { Button } from '../../../components/ui/button'
import { DialogHeader, DialogFooter, Dialog, DialogContent, DialogTitle, DialogDescription } from '../../../components/ui/dialog'
import { Input } from '../../../components/ui/input'
import { useState } from 'react'
import { useMsal } from '@azure/msal-react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Form, FormControl, FormField, FormItem, FormLabel } from '../../../components/ui/form'
import { usePostGoal } from '../../../services/hooks/goal/usePostGoal'

type GoalDialogProps = {
	refetchGoals: () => void
}

export const CreateGoalDialog = ({ refetchGoals }: GoalDialogProps) => {
	const [open, setOpen] = useState(false)
	const currentUserAccount = useMsal().accounts[0]

	const formSchema = z.object({
		description: z.string().min(1, {
			message: 'Description is required',
		}),
	})

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			description: '',
		},
	})

	const onSubmit = (values: z.infer<typeof formSchema>) => {
		postGoalMutation.mutate({
			userId: currentUserAccount.username,
			goal: {
				userId: currentUserAccount.username,
				description: values.description,
				isCompleted: false,
			},
		})
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
			<Button
				className='w-fit self-center'
				onClick={() => setOpen(true)}
			>
				Create Goal
			</Button>
			<DialogContent className='sm:max-w-[425px]'>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className='space-y-2'
					>
						<DialogHeader>
							<DialogTitle>Create Goal</DialogTitle>
							<DialogDescription>Create a new goal. Click save when you're done.</DialogDescription>
						</DialogHeader>
						<FormItem>
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
						</FormItem>
						<DialogFooter>
							<Button type='submit'>Create Goal</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}

