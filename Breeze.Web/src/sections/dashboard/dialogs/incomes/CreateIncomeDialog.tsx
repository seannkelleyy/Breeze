import { useMsal } from '@azure/msal-react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '../../../../components/ui/button'
import { DialogHeader, DialogFooter, DialogContent, Dialog, DialogDescription, DialogTitle } from '../../../../components/ui/dialog'
import { FormField, FormItem, FormLabel, FormControl, Form } from '../../../../components/ui/form'
import { Input } from '../../../../components/ui/input'
import { usePostIncome } from '../../../../services/hooks/income/usePostIncome'
import { useBudgetContext } from '../../../../services/providers/BudgetProvider'

export const CreateIncomeDialog = () => {
	const [open, setOpen] = useState(false)
	const { budget, refetchIncomes, refetchBudget } = useBudgetContext()
	const currentUserAccount = useMsal().accounts[0]

	const income = {
		userId: currentUserAccount.homeAccountId,
		budgetId: budget?.id ?? -1,
		name: '',
		amount: 0,
		date: new Date().toISOString().split('T')[0],
	}

	const formSchema = z.object({
		userId: z.string(),
		budgetId: z.number(),
		name: z.string().min(1, {
			message: 'Name is required',
		}),
		amount: z.coerce.number().min(0, 'Amount must be greater than  0'),
		date: z.string().refine((val) => /^\d{4}-\d{2}-\d{2}$/.test(val), {
			message: 'Invalid date format',
		}),
	})

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: income,
	})

	const onSubmit = (values: z.infer<typeof formSchema>) => {
		postMutation.mutate({
			income: {
				...values,
				budgetId: budget?.id,
				userId: currentUserAccount.homeAccountId,
			},
		})
	}

	const postMutation = usePostIncome({
		onSettled: () => {
			refetchBudget()
			refetchIncomes()
			setOpen(false)
		},
	})
	return (
		<Dialog
			open={open}
			onOpenChange={setOpen}
		>
			<Button onClick={() => setOpen(true)}>Add Income</Button>
			<DialogContent className='sm:max-w-[425px]'>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className='space-y-2'
					>
						<DialogHeader>
							<DialogTitle>Create Income</DialogTitle>
							<DialogDescription>Add a new income entry. Click save when you're done.</DialogDescription>
						</DialogHeader>
						<FormField
							control={form.control}
							name='name'
							render={({ field }) => (
								<FormItem className='grid grid-cols-4 items-center gap-4'>
									<FormLabel className='text-right'>Name</FormLabel>
									<FormControl>
										<Input
											id='name'
											type='text'
											{...field}
											className='col-span-3'
										/>
									</FormControl>
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name='amount'
							render={({ field }) => (
								<FormItem className='grid grid-cols-4 items-center gap-4'>
									<FormLabel className='text-right'>Amount</FormLabel>
									<FormControl>
										<Input
											id='amount'
											type='number'
											{...field}
											className='col-span-3'
										/>
									</FormControl>
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name='date'
							render={({ field }) => (
								<FormItem className='grid grid-cols-4 items-center gap-4'>
									<FormLabel className='text-right'>Date</FormLabel>
									<FormControl>
										<Input
											id='date'
											type='date'
											{...field}
											className='col-span-3'
										/>
									</FormControl>
								</FormItem>
							)}
						/>
						<DialogFooter>
							<Button type='submit'>Create Income</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}

