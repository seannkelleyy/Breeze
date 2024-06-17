import { BreezeBox } from '@/components/shared/BreezeBox'
import { BreezeCard } from '@/components/shared/BreezeCard'
import { BreezeText } from '@/components/shared/BreezeText'
import { DeleteButton } from '@/components/shared/DeleteButton'
import { Expense } from '@/services/hooks/expense/ExpenseServices'
import { useDeleteExpense } from '@/services/hooks/expense/useDeleteExpense'
import { useBudgetContext } from '@/services/providers/BudgetProvider'
import { useDateContext } from '@/services/providers/DateProvider'

type ExpenseItemProps = {
	expense: Expense
	refetchExpenses: () => void
}

export const ExpenseItem = ({ expense, refetchExpenses }: ExpenseItemProps) => {
	const { getMonthAsString } = useDateContext()
	const { categories, refetchBudget, refetchCategories } = useBudgetContext()
	const deleteMutation = useDeleteExpense({
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		category: categories.find((category) => category.id === expense.categoryId)!,
		expense,
		onSettled: () => {
			refetchBudget()
			refetchCategories()
			refetchExpenses()
		},
	})
	return (
		<BreezeCard
			title='Category Overview'
			style={{
				width: '80%',
				gap: '0',
				position: 'relative',
			}}
		>
			<DeleteButton
				style={{
					position: 'absolute',
					top: '8%',
					right: '5%',
					padding: '0',
					margin: '0',
				}}
				onClick={() => deleteMutation.mutate()}
			/>
			<BreezeBox
				title='Expenses'
				style={{
					gap: '.25em',
				}}
			>
				<BreezeText
					text={`Name: ${expense.name}`}
					type='medium'
				/>
				<BreezeText
					text={`Amount: $${expense.amount}`}
					type='medium'
				/>
				<BreezeText
					text={`Date: ${getMonthAsString(expense.month)} ${expense.day} ${expense.year}`}
					type='medium'
				/>
			</BreezeBox>
		</BreezeCard>
	)
}
