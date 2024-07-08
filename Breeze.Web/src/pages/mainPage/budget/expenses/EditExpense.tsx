import { BreezeInput } from '@/components/shared/BreezeInput'
import { Expense } from '@/services/hooks/expense/expenseServices'
import { usePatchExpense } from '@/services/hooks/expense/usePatchExpense'
import { useBudgetContext } from '@/services/providers/BudgetProvider'
import { Controller, useForm } from 'react-hook-form'

type EditExpenseProps = {
	expenseItem: Expense
	refetchExpenses: () => void
}

type EditExpenseInputs = {
	name: string
	amount: number
	date: string
}

/**
 * Component that allows a user to edit an expense.
 */
export const EditExpense = ({ expenseItem, refetchExpenses }: EditExpenseProps) => {
	const { categories, refetchBudget, refetchCategories } = useBudgetContext()

	const { handleSubmit, control } = useForm<EditExpenseInputs>({
		defaultValues: {
			name: expenseItem.name,
			amount: expenseItem.amount,
			date: expenseItem.date,
		},
	})

	const patchMutation = usePatchExpense({
		onSettled: () => {
			refetchBudget()
			refetchCategories()
			refetchExpenses()
		},
	})
	const onSubmit = (data: EditExpenseInputs) => {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const category = categories.find((category) => category.id === expenseItem.categoryId)!
		patchMutation.mutate({
			category,
			expense: {
				id: expenseItem.id,
				userId: expenseItem.userId,
				categoryId: expenseItem.categoryId,
				name: data.name,
				amount: data.amount,
				date: data.date,
			},
		})
	}
	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			style={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				width: '100%',
				gap: '1rem',
			}}
		>
			<Controller
				name='name'
				control={control}
				defaultValue={expenseItem.name}
				rules={{ required: true }}
				render={({ field }) => (
					<BreezeInput
						{...field}
						type='text'
						title='Name'
						placeholder='Expense Name'
						label='Expense Name:'
						selectAllOnClick
						style={{ width: '100%' }}
						onBlur={handleSubmit(onSubmit)}
					/>
				)}
			/>
			<Controller
				name='amount'
				control={control}
				defaultValue={expenseItem.amount}
				rules={{ required: true }}
				render={({ field }) => (
					<BreezeInput
						{...field}
						type='number'
						title='Amount'
						placeholder='Expense Amount'
						label='Expense Amount:'
						selectAllOnClick
						style={{ width: '100%' }}
						onBlur={handleSubmit(onSubmit)}
					/>
				)}
			/>
			<Controller
				name='date'
				control={control}
				defaultValue={expenseItem.date}
				rules={{ required: true }}
				render={({ field }) => (
					<BreezeInput
						{...field}
						type='date'
						title='Expense Date'
						placeholder='date'
						label='Expense Date:'
						style={{ minWidth: '100%' }}
						onBlur={handleSubmit(onSubmit)}
					/>
				)}
			/>
		</form>
	)
}
