import { useMutation } from 'react-query'
import { useCallback } from 'react'
import { Expense, useExpenses } from './expenseServices'

type PostExpenseProps = {
	onSuccess?: () => void
	onSettled?: () => void
}

/**
 * A hook for posting an expense.
 * @param props.onSuccess: - Optional - The function to call when the mutation is successful.
 * @param props.onSettled: - Optional - The function to call when the mutation is settled.
 */

type PostExpenseMutationProps = {
	budgetId: number
	expense: Expense
}
/**
 * Mutation function for posting an expense.
 * @param props.budgetId: The budget Id to post the expense to.
 * @param props.expense: The expense to post.
 */
export const usePostExpense = ({ onSuccess, onSettled }: PostExpenseProps) => {
	const { postExpense } = useExpenses()

	const mutationFn = useCallback(({ budgetId, expense }: PostExpenseMutationProps) => postExpense(budgetId, expense), [postExpense])

	return useMutation(mutationFn, {
		onSuccess: onSuccess,
		onSettled: onSettled,
	})
}

