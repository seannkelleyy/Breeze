import { BreezeInput } from '@/components/shared/BreezeInput'
import { Expense } from '@/services/hooks/expense/expenseServices'
import { usePatchExpense } from '@/services/hooks/expense/usePatchExpense'
import { useBudgetContext } from '@/services/providers/BudgetProvider'
import dayjs from 'dayjs'
import { useState } from 'react'

type EditExpenseProps = {
	expenseItem: Expense
	refetchExpenses: () => void
}
export const EditExpense = ({ expenseItem, refetchExpenses }: EditExpenseProps) => {
	const { categories, refetchBudget, refetchCategories } = useBudgetContext()
	const [expense, setExpense] = useState<Expense>({
		id: expenseItem.id,
		userId: expenseItem.userId,
		categoryId: expenseItem.categoryId,
		name: expenseItem.name,
		amount: expenseItem.amount,
		date: expenseItem.date,
	})

	const patchMutation = usePatchExpense({
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
		<>
			<BreezeInput
				type='text'
				title='Name'
				placeholder='Expense Name'
				defaultValue={expense.name}
				selectAllOnClick
				onChange={(e) => {
					setExpense({ ...expense, name: e.target.value })
				}}
				onBlur={() => patchMutation.mutate()}
				style={{
					width: '100%',
					textAlign: 'center',
					backgroundColor: 'var(--color-input-background)',
				}}
			/>
			<BreezeInput
				type='text'
				title='Amount'
				placeholder='Expense Amount'
				defaultValue={expense.amount.toString()}
				selectAllOnClick
				onChange={(e) => {
					setExpense({ ...expense, amount: Number(e.target.value) })
				}}
				onBlur={() => patchMutation.mutate()}
				style={{
					width: '100%',
					textAlign: 'center',
					backgroundColor: 'var(--color-input-background)',
				}}
			/>
			<BreezeInput
				type='date'
				title='Expense Date'
				placeholder='date'
				defaultValue={expense.date}
				style={{ minWidth: '100%' }}
				onChange={(e) => {
					setExpense({ ...expense, date: dayjs(e.target.value).format('YYYY-MM-DD') })
				}}
			/>
		</>
	)
}
