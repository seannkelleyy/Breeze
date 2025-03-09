import { Button } from '../../../../components/ui/button'
import { DialogHeader, DialogFooter, Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger } from '../../../../components/ui/dialog'
import { Input } from '../../../../components/ui/input'
import { Expense } from '../../../../services/hooks/expense/expenseServices'
import { useState } from 'react'
import { useBudgetContext } from '../../../../services/providers/BudgetProvider'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Form, FormControl, FormField, FormItem, FormLabel } from '../../../../components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select'
import { Pencil } from 'lucide-react'
import { usePatchExpense } from '../../../../services/hooks/expense/usePatchExpense'
import { useDeleteExpense } from '../../../../services/hooks/expense/useDeleteExpense'
import { DeleteConfirmationDialog } from '../../../../components/reusable/DeleteConfirmationDialog'

type EditExpenseDialogProps = {
	existingExpense: Expense
}

export const EditExpenseDialog = ({ existingExpense }: EditExpenseDialogProps) => {
	const [open, setOpen] = useState(false)
	const { budget, categories, refetchCategories, refetchBudget, refetchExpenses } = useBudgetContext()

	const expense = { ...existingExpense, date: new Date(existingExpense.date).toISOString().split('T')[0] }

	const formSchema = z.object({
		id: z.number(),
		userId: z.string(),
		name: z.string().min(1, {
			message: 'Name is required',
		}),
		categoryId: z.number().min(1, {
			message: 'Category is required',
		}),
		amount: z.coerce.number().min(0, 'Amount must be greater than  0'),
		date: z.string().refine((val) => /^\d{4}-\d{2}-\d{2}$/.test(val), {
			message: 'Invalid date format',
		}),
	})

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: expense,
	})

	const patchMutation = usePatchExpense({
		onSettled: () => {
			refetchBudget()
			refetchCategories()
			refetchExpenses()
			setOpen(false)
		},
	})

	const deleteMutation = useDeleteExpense({
		onSettled: () => {
			refetchBudget()
			refetchCategories()
			refetchExpenses()
			setOpen(false)
		},
	})

	const onSubmit = (values: z.infer<typeof formSchema>) => {
		patchMutation.mutate({
			budgetId: budget?.id,
			expense: {
				...values,
			},
		})
	}

	return (
		<Dialog
			open={open}
			onOpenChange={setOpen}
		>
			<DialogTrigger
				onClick={() => setOpen(true)}
				className='hover:cursor-pointer'
			>
				<Pencil />
			</DialogTrigger>
			<DialogContent className='sm:max-w-[425px]'>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className='space-y-2'
					>
						<DialogHeader>
							<DialogTitle>Edit Expense</DialogTitle>
							<DialogDescription>Make changes to your expense here. Click save when you're done.</DialogDescription>
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
							name='categoryId'
							render={({ field }) => (
								<FormItem className='grid grid-cols-4 items-center gap-4'>
									<FormLabel className='text-right'>Category</FormLabel>
									<FormControl>
										<Select
											value={field.value?.toString() || ''}
											onValueChange={(value) => field.onChange(Number(value))}
										>
											<SelectTrigger className='col-span-3'>
												<SelectValue>{categories.find((category) => category.id === field.value)?.name || 'Select a category'}</SelectValue>
											</SelectTrigger>
											<SelectContent className='bg-background'>
												{categories.map((category) => (
													<SelectItem
														key={category.id}
														value={String(category.id)}
													>
														{category.name}
													</SelectItem>
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
						<DialogFooter className='flex items-center'>
							<DeleteConfirmationDialog
								onDelete={() => deleteMutation.mutate({ budgetId: budget.id, expense: existingExpense })}
								itemType={'Expense'}
								additionalText={`You are about to delete the expense: ${existingExpense.name}`}
							/>
							<Button type='submit'>Save Changes</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}

