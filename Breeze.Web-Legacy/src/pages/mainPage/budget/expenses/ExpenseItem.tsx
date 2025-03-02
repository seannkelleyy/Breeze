/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { BreezeCard } from '@/components/shared/BreezeCard'
import { DeleteButton } from '@/components/shared/DeleteButton'
import { Expense } from '@/services/hooks/expense/expenseServices'
import { useDeleteExpense } from '@/services/hooks/expense/useDeleteExpense'
import { useBudgetContext } from '@/services/providers/BudgetProvider'
import { useState } from 'react'
import { EditExpense } from './EditExpense'
import { ViewExpense } from './ViewExpense'
import { EditButton } from '@/components/shared/EditButton'
import { BreezeBox } from '@/components/shared/BreezeBox'

type ExpenseItemProps = {
	expense: Expense
	refetchExpenses: () => void
}

/**
 * This is the expense item component that displays the details of an expense. This is displayed
 * in the CategoryOverview component.
 * @param expense. The expense to display.
 * @param refetchExpenses. The function to refetch the expenses.
 */
export const ExpenseItem = ({ expense, refetchExpenses }: ExpenseItemProps) => {
	const { categories, refetchBudget, refetchCategories } = useBudgetContext()
	const [isEditMode, setIsEditMode] = useState<boolean>(false)

	const deleteMutation = useDeleteExpense({
		onSuccess: () => {
			refetchBudget()
			refetchCategories()
			refetchExpenses()
		},
	})
	return (
		<BreezeCard
			title='Category Overview'
			secondary
			style={{
				gap: '0',
				position: 'relative',
				minWidth: '50%',
				maxWidth: 'auto',
			}}
		>
			<BreezeBox
				title='Expense Tools'
				direction='row'
				style={{
					width: '100%',
					justifyContent: 'space-between',
					alignItems: 'center',
				}}
			>
				<EditButton onClick={() => setIsEditMode(!isEditMode)} />
				<DeleteButton onClick={() => deleteMutation.mutate({ category: categories.find((category) => category.id === expense.categoryId)!, expense })} />
			</BreezeBox>
			<BreezeBox
				title='Edit Expense'
				style={{
					margin: '.5em',
				}}
			>
				{isEditMode ? (
					<EditExpense
						expenseItem={expense}
						refetchExpenses={refetchExpenses}
					/>
				) : (
					<ViewExpense expense={expense} />
				)}
			</BreezeBox>
		</BreezeCard>
	)
}
