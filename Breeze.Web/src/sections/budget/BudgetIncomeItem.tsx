import { Input } from '../../components/ui/input'
import { FormField, FormItem, FormControl } from '../../components/ui/form'
import { DeleteConfirmationDialog } from '../../components/reusable/DeleteConfirmationDialog'
import { UseFormReturn } from 'react-hook-form'

type BudgetIncomeItemProps = {
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
	deleteIncome: (index: number) => void
}
export const BudgetIncomeItem = ({ index, form, deleteIncome }: BudgetIncomeItemProps) => {
	return (
		<section
			className='flex gap-2 items-center'
			title='Budget Income'
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
							/>
						</FormControl>
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name={`incomes.${index}.date`}
				render={({ field }) => (
					<FormItem>
						<FormControl>
							<Input
								{...field}
								type='date'
								placeholder='Income Date'
							/>
						</FormControl>
					</FormItem>
				)}
			/>
			<DeleteConfirmationDialog
				itemType='income'
				additionalText={`You are about to delete the income: ${form.getValues().incomes[index].name}`}
				onDelete={() => deleteIncome(index)}
			/>
		</section>
	)
}

