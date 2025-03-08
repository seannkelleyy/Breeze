import { Button } from '../../../components/ui/button'
import { DialogHeader, DialogFooter, Dialog, DialogContent, DialogTitle, DialogDescription } from '../../../components/ui/dialog'
import { Input } from '../../../components/ui/input'
import { Expense } from '../../../services/hooks/expense/expenseServices'
import { useMsal } from '@azure/msal-react'
import { useState } from 'react'
import { useBudgetContext } from '../../../services/providers/BudgetProvider'
import { usePostExpense } from '../../../services/hooks/expense/usePostExpense'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Form, FormControl, FormField, FormItem, FormLabel } from '../../../components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { useFetchExpenses } from '../../../services/hooks/expense/useFetchExpenses'

type ExpenseDialogProps = {
	existingExpense?: Expense
}

export const ExpenseDialog = ({ existingExpense }: ExpenseDialogProps) => {
	const [open, setOpen] = useState(false)
	const { budget, categories, refetchCategories, refetchBudget } = useBudgetContext()
	const currentUserAccount = useMsal().accounts[0]

	const expense = existingExpense ?? {
		userId: currentUserAccount.username,
		categoryId: categories[0]?.id ?? 1,
		name: '',
		amount: 0,
		date: new Date().toISOString().split('T')[0],
	}
	const { refetch: refetchExpenses } = useFetchExpenses({ category: categories.find((category) => category.id === expense.categoryId) ?? categories[0] })

	const formSchema = z.object({
		name: z.string().min(1, {
			message: 'Name is required',
		}),
		categoryId: z.number().min(1, {
			message: 'Category is required',
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
		defaultValues: expense,
	})

	const postMutation = usePostExpense({
		onSettled: () => {
			refetchBudget()
			refetchCategories()
			setOpen(false)
		},
	})

	const onSubmit = (values: z.infer<typeof formSchema>) => {
		const expenseToSubmit = {
			...values,
			budgetId: budget?.id,
			userId: currentUserAccount.username,
		}
		console.log(expenseToSubmit)
		postMutation.mutate({ budgetId: budget?.id, expense: expenseToSubmit })
		refetchExpenses()
	}

	return (
		<Dialog
			open={open}
			onOpenChange={setOpen}
		>
			<Button onClick={() => setOpen(true)}>Add Expense</Button>
			<DialogContent className='sm:max-w-[425px]'>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)}>
						<DialogHeader>
							<DialogTitle>{expense ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
							<DialogDescription>
								{expense ? "Make changes to your expense here. Click save when you're done." : "Add a new expense entry. Click save when you're done."}
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
								name='categoryId'
								render={({ field }) => (
									<FormItem className='grid grid-cols-4 items-center gap-4'>
										<FormLabel className='text-right'>Category</FormLabel>
										<FormControl>
											<Select
												{...field}
												value={field.value.toString()}
												onValueChange={(value) => field.onChange(Number(value))}
											>
												<SelectTrigger className='col-span-3'>
													<SelectValue>{categories.find((category) => category.id === field.value)?.name}</SelectValue>
												</SelectTrigger>
												<SelectContent className='bg-background'>
													{categories.map((category, index) => (
														<div key={category.id}>
															<SelectItem
																value={String(category.id)}
																className={`hover:cursor-pointer hover:bg-accent hover:text-white w-full ${index < categories.length - 1 ? 'border-b' : ''}`}
															>
																{category.name}
															</SelectItem>
														</div>
													))}
												</SelectContent>
											</Select>
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
							<Button type='submit'>{expense ? 'Save changes' : 'Add Expense'}</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}

