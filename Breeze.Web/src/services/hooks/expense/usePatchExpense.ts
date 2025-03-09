import { useMutation } from 'react-query'
import { useCallback } from 'react'
import { Expense, useExpenses } from './expenseServices'

type PatchExpenseProps = {
	onSuccess?: () => void
	onSettled?: () => void
}

/**
 * A hook for patching an expense.
 * @param props.onSuccess: - Optional - The function to call when the mutation is successful.
 * @param props.onSettled: - Optional - The function to call when the mutation is settled.
 */

type PatchExpenseMutationProps = {
	budgetId: number
	expense: Expense
}

/**
 * Mutation function for patching an expense.
 * @param props.budgetId: The budget Id of the expense to patch.
 * @param props.expense: The expense to patch.
 */

export const usePatchExpense = ({ onSuccess, onSettled }: PatchExpenseProps) => {
	const { patchExpense } = useExpenses()

	const mutationFn = useCallback(({ budgetId, expense }: PatchExpenseMutationProps) => patchExpense(budgetId, expense), [patchExpense])

	return useMutation(mutationFn, {
		onSuccess: onSuccess,
		onSettled: onSettled,
	})
}
