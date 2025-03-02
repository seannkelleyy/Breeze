import { BreezeText } from '@/components/shared/BreezeText'
import { Expense } from '@/services/hooks/expense/expenseServices'
import dayjs from 'dayjs'

type ViewExpenseProps = {
	expense: Expense
}

export const ViewExpense = ({ expense }: ViewExpenseProps) => {
	return (
		<>
			<BreezeText
				text={`Name: ${expense.name}`}
				type='medium'
			/>
			<BreezeText
				text={`Amount: $${expense.amount}`}
				type='medium'
			/>
			<BreezeText
				text={`Date: ${dayjs(expense.date).format('MM/DD/YYYY')}`}
				type='medium'
			/>
		</>
	)
}
