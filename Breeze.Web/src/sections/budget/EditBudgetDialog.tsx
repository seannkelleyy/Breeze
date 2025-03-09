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
import { usePatchCategory } from '../../services/hooks/category/usePatchCategory'
import { usePostIncome } from '../../services/hooks/income/usePostIncome'
import { usePatchIncome } from '../../services/hooks/income/usePatchIncome'
import { useDeleteCategory } from '../../services/hooks/category/useDeleteCategory'
import { useDeleteIncome } from '../../services/hooks/income/useDeleteIncome'
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

export const EditBudgetDialog = () => {
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

	const patchCategoryMutation = usePatchCategory({
		onSettled: () => {
			refetchBudget()
			refetchCategories()
		},
	})

	const deleteCategoryMutation = useDeleteCategory({
		onSettled: () => refetchCategories(),
	})

	const postIncomeMutation = usePostIncome({
		onSettled: () => {
			refetchBudget()
			refetchIncomes()
		},
	})

	const patchIncomeMutation = usePatchIncome({
		onSettled: () => {
			refetchBudget()
			refetchIncomes()
		},
	})

	const deleteIncomeMutation = useDeleteIncome({
		onSettled: () => refetchCategories(),
	})

	const handleDeleteCategory = (index: number) => {
		const categoryToDelete = form.getValues().categories[index]
		if (categoryToDelete.id !== -1) {
			deleteCategoryMutation.mutate({ category: categoryToDelete })
		}
		const updatedCategories = form.getValues().categories.filter((_, i) => i !== index)
		form.setValue('categories', updatedCategories)
	}

	const handleDeleteIncome = (index: number) => {
		const incomeToDelete = form.getValues().incomes[index]
		if (incomeToDelete.id !== -1) {
			deleteIncomeMutation.mutate({ income: incomeToDelete })
		}
		const updatedIncomes = form.getValues().incomes.filter((_, i) => i !== index)
		form.setValue('incomes', updatedIncomes)
	}

	const onSubmit = (values: z.infer<typeof formSchema>) => {
		values.categories.forEach((category) => {
			const existingCategory = categories.find((c) => c.name === category.name)
			if (existingCategory) {
				patchCategoryMutation.mutate({ category: category })
			} else {
				postCategoryMutation.mutate({ category: category })
			}
		})

		values.incomes.forEach((income) => {
			const existingIncome = incomes.find((i) => i.id === income.id)
			if (existingIncome) {
				patchIncomeMutation.mutate({ income: income })
			} else {
				postIncomeMutation.mutate({ income: income })
			}
		})

		setOpen(false)
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
								{<span className={totalIncome - totalExpenses >= 0 ? 'p-1 rounded-sm bg-success' : ' p-1 rounded-sm bg-destructive'}>{totalIncome - totalExpenses}</span>}
							</h1>
						</DialogHeader>
						<section
							title='Budget Incomes'
							className='grid gap-2 py-4 mt-2'
						>
							<h2 className='text-xl font-bold'>Estimated Incomes</h2>
							<h3 className='font-bold'>Total Income: ${totalIncome}</h3>
							{form.watch('incomes').map((_, index) => (
								<BudgetIncomeItem
									index={index}
									form={form}
									deleteIncome={handleDeleteIncome}
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
						</section>
						<section
							title='Budget Expenses'
							className='grid gap-2 py-4 mt-2'
						>
							<h2 className='text-xl font-bold'>Estimated Expenses</h2>
							<h3 className='font-bold'>Total Expenses: ${totalExpenses}</h3>
							{form.watch('categories').map((_, index) => (
								<BudgetExpenseItem
									index={index}
									form={form}
									deleteCategory={handleDeleteCategory}
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
						</section>
						<DialogFooter>
							<Button type='submit'>Save Budget</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}

