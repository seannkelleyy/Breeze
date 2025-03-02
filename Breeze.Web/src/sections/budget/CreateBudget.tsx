import { Button } from '../../components/ui/button'
import { useState } from 'react'
import { useMsal } from '@azure/msal-react'
import { Input } from '../../components/ui/input'
import { useBudgetContext } from '../../services/providers/BudgetProvider'
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog'
import { Form, FormControl, FormField, FormItem } from '../../components/ui/form'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { usePostCategory } from '../../services/hooks/category/usePostCategory'
import { Trash } from 'lucide-react'

const formSchema = z.object({
	incomes: z.array(
		z.object({
			name: z.string().min(1, 'Name is required'),
			amount: z
				.string()
				.refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
					message: 'Amount must be greater than 0',
				})
				.transform((val) => parseFloat(val)),
		}),
	),
	categories: z.array(
		z.object({
			userId: z.string(),
			name: z.string().min(1, 'Name is required'),
			budgetId: z.number(),
			currentSpend: z.number(),
			allocation: z
				.string()
				.refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
					message: 'Allocation must be non-negative',
				})
				.transform((val) => parseFloat(val)),
		}),
	),
})

export const CreateBudget = () => {
	const [open, setOpen] = useState(false)
	const account = useMsal().accounts[0]
	const { budget, refetchCategories, refetchBudget } = useBudgetContext()

	const form = useForm({
		resolver: zodResolver(formSchema),
		defaultValues: {
			incomes: [{ name: '', amount: 0 }],
			categories: [{ userId: account.homeAccountId, name: '', budgetId: budget.id, currentSpend: 0, allocation: 0 }],
		},
	})

	const postMutation = usePostCategory({
		onSettled: () => {
			refetchBudget()
			refetchCategories()
		},
	})

	const onSubmit = (values: z.infer<typeof formSchema>) => {
		console.log('Budget Data:', values)
		values.categories.forEach((category) => {
			postMutation.mutate({ category })
		})
		setOpen(false)
	}

	const removeIncome = (index: number) => {
		const incomes = form.getValues().incomes.filter((_, i) => i !== index)
		form.setValue('incomes', incomes)
	}

	const removeCategory = (index: number) => {
		const categories = form.getValues().categories.filter((_, i) => i !== index)
		form.setValue('categories', categories)
	}

	const totalIncome = Number((form.getValues().incomes ?? []).reduce((sum, income) => sum + (Number(income.amount) || 0), 0))

	const totalExpenses = Number((form.getValues().categories ?? []).reduce((sum, category) => sum + (Number(category.allocation) || 0), 0))

	return (
		<Dialog
			open={open}
			onOpenChange={setOpen}
		>
			<DialogTrigger>Create Budget</DialogTrigger>
			<DialogContent className='sm:max-w-[425px] max-h-[80vh] overflow-y-auto'>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)}>
						<DialogHeader>
							<DialogTitle className='text-2xl'>Create Budget</DialogTitle>
							<DialogDescription>Define your estimated incomes and expenses.</DialogDescription>
							<h1 className='text-lg font-bold'>
								Total Budget: $
								{
									<span className={totalIncome - totalExpenses >= 0 ? 'p-1 rounded-sm bg-success' : ' p-1 rounded-sm bg-destructive'}>
										{(totalIncome - totalExpenses).toFixed(2)}
									</span>
								}
							</h1>
							<DialogDescription>Ideally this number will be 0. </DialogDescription>
						</DialogHeader>
						<div className='grid gap-2 py-4'>
							<h2 className='text-xl font-bold'>Estimated Incomes</h2>
							<h3 className='font-bold'>Total Income: ${Number(totalIncome).toFixed(2)}</h3>
							{form.watch('incomes').map((_, index) => (
								<div
									key={index}
									className='flex gap-4 items-center'
								>
									<FormField
										control={form.control}
										name={`incomes.${index}.name`}
										render={({ field }) => (
											<FormItem>
												<FormControl>
													<Input
														{...field}
														placeholder='Income Name'
													/>
												</FormControl>
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name={`incomes.${index}.amount`}
										render={({ field }) => (
											<FormItem>
												<FormControl>
													<Input
														type='number'
														{...field}
														placeholder='Amount'
														value={field.value === 0 ? '' : field.value}
														onFocus={(e) => {
															e.target.select()
															if (e.target.value === '0') e.target.value = ''
														}}
														onBlur={(e) => {
															if (e.target.value === '') e.target.value = '0'
														}}
													/>
												</FormControl>
											</FormItem>
										)}
									/>
									<Button
										type='button'
										variant='ghost'
										onClick={() => removeIncome(index)}
									>
										<Trash />
									</Button>
								</div>
							))}
							<Button
								type='button'
								onClick={() => form.setValue('incomes', [...form.getValues().incomes, { name: '', amount: 0 }])}
							>
								Add Income
							</Button>
							<h2 className='text-xl font-bold mt-2'>Estimated Expenses</h2>
							<h3 className='font-bold'>Total Expenses: ${Number(totalExpenses).toFixed(2)}</h3>
							{form.watch('categories').map((_, index) => (
								<div
									key={index}
									className='flex gap-4 items-center'
								>
									<FormField
										control={form.control}
										name={`categories.${index}.name`}
										render={({ field }) => (
											<FormItem>
												<FormControl>
													<Input
														{...field}
														placeholder='Expense Name'
													/>
												</FormControl>
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name={`categories.${index}.allocation`}
										render={({ field }) => (
											<FormItem>
												<FormControl>
													<Input
														type='number'
														{...field}
														value={field.value === 0 ? '' : field.value}
														placeholder='Amount'
														onFocus={(e) => {
															e.target.select()
															if (e.target.value === '0') e.target.value = ''
														}}
														onBlur={(e) => {
															if (e.target.value === '') e.target.value = '0'
														}}
													/>
												</FormControl>
											</FormItem>
										)}
									/>
									<Button
										type='button'
										variant='ghost'
										onClick={() => removeCategory(index)}
									>
										<Trash />
									</Button>
								</div>
							))}
							<Button
								type='button'
								onClick={() =>
									form.setValue('categories', [...form.getValues().categories, { userId: account.homeAccountId, name: '', budgetId: budget.id, currentSpend: 0, allocation: 0 }])
								}
							>
								Add Expense
							</Button>
						</div>
						<DialogFooter>
							<Button type='submit'>Save Budget</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}

