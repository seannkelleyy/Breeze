import { Button } from '../../components/ui/button'
import { useEffect, useState } from 'react'
import { useMsal } from '@azure/msal-react'
import { useBudgetContext } from '../../services/providers/BudgetProvider'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog'
import { Form } from '../../components/ui/form'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { usePostCategory } from '../../services/hooks/category/usePostCategory'
import { usePostIncome } from '../../services/hooks/income/usePostIncome'
import { BudgetExpenseItem } from './BudgetExpenseItem'
import { BudgetIncomeItem } from './BudgetIncomeItem'

const formSchema = z.object({
	incomes: z.array(
		z.object({
			id: z.number().optional(),
			userId: z.string(),
			budgetId: z.number(),
			name: z.string().min(1, 'Name is required'),
			amount: z.coerce.number().min(0, 'Amount must be greater than or equal to 0'),
			date: z.string().refine((val) => /^\d{4}-\d{2}-\d{2}$/.test(val), {
				message: 'Invalid date format',
			}),
		}),
	),
	categories: z.array(
		z.object({
			id: z.number().optional(),
			userId: z.string(),
			name: z.string().min(1, 'Name is required'),
			budgetId: z.number(),
			currentSpend: z.number(),
			allocation: z.coerce.number().min(0, 'Allocation must be non-negative'),
		}),
	),
})

export const CreateBudgetDialog = () => {
	const [open, setOpen] = useState(false)
	const account = useMsal().accounts[0]
	const { budget, categories, incomes, refetchCategories, refetchBudget, refetchIncomes } = useBudgetContext()

	const form = useForm({
		resolver: zodResolver(formSchema),
		defaultValues: {
			incomes: incomes.map((income) => ({
				id: income.id,
				userId: income.userId,
				budgetId: income.budgetId,
				name: income.name,
				amount: income.amount,
				date: income.date,
			})),
			categories: categories.map((category) => ({
				id: category.id,
				userId: category.userId,
				name: category.name,
				budgetId: category.budgetId,
				currentSpend: category.currentSpend,
				allocation: category.allocation,
			})),
		},
	})

	const postCategoryMutation = usePostCategory({
		onSettled: () => {
			refetchBudget()
			refetchCategories()
		},
	})

	const postIncomeMutation = usePostIncome({
		onSettled: () => {
			refetchBudget()
			refetchIncomes()
		},
	})

	const onSubmit = (values: z.infer<typeof formSchema>) => {
		values.categories.forEach((category) => {
			postCategoryMutation.mutate({ category })
		})

		values.incomes.forEach((income) => {
			postIncomeMutation.mutate({ income })
		})

		setOpen(false)
	}

	const removeIncome = (index: number) => {
		const formIncomes = form.getValues().incomes
		const updatedIncomes = formIncomes.filter((_, i) => i !== index)
		form.setValue('incomes', updatedIncomes)
	}

	const removeExpenseCategory = (index: number) => {
		const formCategories = form.getValues().categories
		const updatedCategories = formCategories.filter((_, i) => i !== index)
		form.setValue('categories', updatedCategories)
	}

	const totalIncome = Number((form.getValues().incomes ?? []).reduce((sum, income) => sum + (Number(income.amount) || 0), 0))
	const totalExpenses = Number((form.getValues().categories ?? []).reduce((sum, category) => sum + (Number(category.allocation) || 0), 0))

	useEffect(() => {
		if (open && incomes.length > 0 && categories.length > 0) {
			form.reset({
				incomes: incomes.map((income) => ({
					id: income.id,
					userId: income.userId,
					budgetId: income.budgetId,
					name: income.name,
					amount: income.amount,
					date: income.date,
				})),
				categories: categories.map((category) => ({
					id: category.id,
					userId: category.userId,
					name: category.name,
					budgetId: category.budgetId,
					currentSpend: category.currentSpend,
					allocation: category.allocation,
				})),
			})
		}
	}, [open, incomes, categories, budget, form])

	return (
		<Dialog
			open={open}
			onOpenChange={setOpen}
		>
			<Button onClick={() => setOpen(true)}>Edit Budget</Button>
			<DialogContent className='max-h-[80vh] overflow-y-auto'>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)}>
						<DialogHeader>
							<DialogTitle className='text-2xl'>Edit Budget</DialogTitle>
							<DialogDescription>Edit and add your estimated incomes and expenses.</DialogDescription>
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
						<div
							title='Budget Incomes'
							className='grid gap-2 py-4 mt-2'
						>
							<h2 className='text-xl font-bold'>Estimated Incomes</h2>
							<h3 className='font-bold'>Total Income: ${Number(totalIncome).toFixed(2)}</h3>
							{form.watch('incomes').map((_, index) => (
								<BudgetIncomeItem
									index={index}
									form={form}
									deleteIncome={removeIncome}
								/>
							))}

							<Button
								type='button'
								onClick={() => {
									const updatedIncomes = [
										...form.getValues().incomes,
										{ id: -1, userId: account.homeAccountId, budgetId: budget.id, name: '', amount: 0, date: new Date().toISOString().split('T')[0] },
									]
									form.setValue('incomes', updatedIncomes, { shouldValidate: false })
								}}
							>
								Add Income
							</Button>
						</div>
						<div
							title='Budget Expenses'
							className='grid gap-2 py-4 mt-2'
						>
							<h2 className='text-xl font-bold'>Estimated Expenses</h2>
							<h3 className='font-bold'>Total Expenses: ${Number(totalExpenses).toFixed(2)}</h3>
							{form.watch('categories').map((_, index) => (
								<BudgetExpenseItem
									index={index}
									form={form}
									deleteCategory={removeExpenseCategory}
								/>
							))}
							<Button
								type='button'
								onClick={() => {
									const updatedCategories = [
										...form.getValues().categories,
										{ id: -1, userId: account.homeAccountId, name: '', budgetId: budget.id, currentSpend: 0, allocation: 0 },
									]
									form.setValue('categories', updatedCategories, { shouldValidate: false })
								}}
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

