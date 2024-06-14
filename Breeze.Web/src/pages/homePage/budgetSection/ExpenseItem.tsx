import { BreezeBox } from '@/components/shared/BreezeBox'
import { BreezeCard } from '@/components/shared/BreezeCard'
import { BreezeText } from '@/components/shared/BreezeText'
import { DeleteButton } from '@/components/shared/DeleteButton'
import { Expense, useExpenses } from '@/services/hooks/ExpenseServices'
import { useBudgetContext } from '@/services/providers/BudgetProvider'
import { useDateContext } from '@/services/providers/DateProvider'
import { useMutation } from 'react-query'

type ExpenseItemProps = {
	expense: Expense
}

export const ExpenseItem = ({ expense }: ExpenseItemProps) => {
	const { getMonthAsString } = useDateContext()
	const { deleteExpense } = useExpenses()
	const { categories, refetchBudget, refetchCategories } = useBudgetContext()
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const deleteMutation = useMutation((expense: Expense) => deleteExpense(categories.find((category) => category.id === expense.categoryId)!, expense), {
		onSettled: () => {
			refetchBudget()
			refetchCategories()
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
				onClick={() => deleteMutation.mutate(expense)}
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
