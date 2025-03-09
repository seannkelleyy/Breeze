import { Input } from '../../components/ui/input'
import { FormField, FormItem, FormControl } from '../../components/ui/form'
import { DeleteConfirmationDialog } from '../../components/reusable/DeleteConfirmationDialog'
import { UseFormReturn } from 'react-hook-form'

type BudgetExpenseItemProps = {
	index: number
	form: UseFormReturn<
		{
			incomes: {
				id: number | undefined
				userId: string
				budgetId: number
				name: string
				amount: number
				date: string
			}[]
			categories: {
				id: number | undefined
				userId: string
				name: string
				budgetId: number
				currentSpend: number
				allocation: number
			}[]
		},
		undefined
	>
	deleteCategory: (index: number) => void
}

export const BudgetExpenseItem = ({ index, form, deleteCategory }: BudgetExpenseItemProps) => {
	return (
		<section
			className='flex gap-2 items-center'
			title='Budget Expense'
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
								placeholder='Allocation'
							/>
						</FormControl>
					</FormItem>
				)}
			/>
			<DeleteConfirmationDialog
				itemType='expense category'
				additionalText={
					<>
						<p>Deleting this category will remove all expenses associated with it.</p>
						<p>Are you sure you want to delete this category?</p>
					</>
				}
				onDelete={() => deleteCategory(index)}
			/>
		</section>
	)
}

