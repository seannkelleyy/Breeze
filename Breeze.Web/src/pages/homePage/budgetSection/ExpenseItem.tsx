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
	const { budget, categories, getBudgetForDate } = useBudgetContext()
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const deleteMutation = useMutation((expense: Expense) => deleteExpense(categories.find((category) => category.id === expense.categoryId)!, expense), {
		onSuccess: () => getBudgetForDate(budget.year, budget.month),
	})
	return (
		<BreezeCard
			title='Category Overview'
			style={{
				width: '80%',
			}}
		>
			<BreezeBox
				title='Expenses'
				style={{
					padding: '0.5rem',
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
				<DeleteButton onClick={() => deleteMutation.mutate(expense)} />
			</BreezeBox>
		</BreezeCard>
	)
}
