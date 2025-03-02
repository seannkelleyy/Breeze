import { Button } from '../../../components/ui/button'
import { DialogHeader, DialogFooter, Dialog, DialogContent, DialogTitle, DialogDescription } from '../../../components/ui/dialog'
import { Input } from '../../../components/ui/input'
import { Income } from '../../../services/hooks/income/incomeServices'
import { usePostIncome } from '../../../services/hooks/income/usePostIncome'
import { useBudgetContext } from '../../../services/providers/BudgetProvider'
import { useState } from 'react'
import { useMsal } from '@azure/msal-react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Form, FormControl, FormField, FormItem, FormLabel } from '../../../components/ui/form'

type IncomeDialogProps = {
	existingIncome?: Income
}

export const IncomeDialog = ({ existingIncome }: IncomeDialogProps) => {
	const [open, setOpen] = useState(false)
	const { budget, refetchIncomes, refetchBudget } = useBudgetContext()
	const currentUserAccount = useMsal().accounts[0]

	const income = existingIncome
		? { ...existingIncome, date: new Date(existingIncome.date).toISOString().split('T')[0] }
		: {
				userId: currentUserAccount.homeAccountId,
				budgetId: budget?.id ?? -1,
				name: '',
				amount: 0,
				date: new Date().toISOString().split('T')[0],
		  }

	const formSchema = z.object({
		name: z.string().min(1, {
			message: 'Name is required',
		}),
		amount: z
			.string()
			.refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
				message: 'Amount must be greater than 0',
			})
			.transform((val) => parseFloat(val)),
		date: z.string().refine((val) => /^\d{4}-\d{2}-\d{2}$/.test(val), {
			message: 'Invalid date format',
		}),
	})

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: income,
	})

	const onSubmit = (values: z.infer<typeof formSchema>) => {
		const incomeToSubmit = {
			...values,
			budgetId: budget?.id,
			userId: currentUserAccount.username,
		}
		console.log(incomeToSubmit)
		postMutation.mutate({ income: incomeToSubmit })
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
					<form onSubmit={form.handleSubmit(onSubmit)}>
						<DialogHeader>
							<DialogTitle>{income ? 'Edit Income' : 'Add Income'}</DialogTitle>
							<DialogDescription>
								{income ? "Make changes to your income here. Click save when you're done." : "Add a new income entry. Click save when you're done."}
							</DialogDescription>
						</DialogHeader>
						<div className='grid gap-4 py-4'>
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
						</div>
						<DialogFooter>
							<Button type='submit'>{income ? 'Save changes' : 'Add Income'}</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}

