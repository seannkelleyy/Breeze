import { useState } from 'react'
import { BreezeInput } from '../../../components/shared/BreezeInput'
import { BreezeText } from '../../../components/shared/BreezeText'
import { useAuth0 } from '@auth0/auth0-react'
import { useBudgetContext } from '../../../services/providers/BudgetProvider'
import { BreezeButton } from '../../../components/shared/BreezeButton'
import { BreezeSelect } from '../../../components/shared/BreezeSelect'
import { Expense } from '../../../services/hooks/expense/expenseServices'
import { usePostExpense } from '@/services/hooks/expense/usePostExpense'
import { BreezeModal } from '@/components/shared/BreezeModal'
import dayjs from 'dayjs'
import { useFetchExpenses } from '@/services/hooks/expense/useFetchExpenses'
import { LoadingEffect } from '@/components/shared/LoadingEffect'

type AddExpenseProps = {
	setShowModal: (showModal: boolean | ((prevShowModal: boolean) => boolean)) => void
}
/**
 * This component is the page where a user can add an expense.
 * @param setShowModal. A function to set the modal.
 */
export const AddExpenseModal = ({ setShowModal }: AddExpenseProps) => {
	const { user } = useAuth0()
	const { categories, refetchBudget, refetchCategories } = useBudgetContext()
	const [isSubmittable, setIsSubmittable] = useState(false)
	const [expense, setExpense] = useState<Expense>({
		userId: user?.email ?? '',
		categoryId: categories[0]?.id ?? -1,
		name: '',
		amount: 0,
		date: dayjs().format('YYYY-MM-DD'),
	})
	const { refetch: refetchExpenses } = useFetchExpenses({ category: categories.find((category) => category.id === expense.categoryId) ?? categories[0] })

	const postMutation = usePostExpense({
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		category: categories.find((category) => category.id === expense.categoryId)!,
		expense: expense,
		onSettled: () => {
			refetchCategories()
			refetchBudget()
			refetchExpenses()
		},
	})

	const checkSubmittable = () => {
		if (expense.name !== '' && expense.categoryId !== -1 && expense.amount && expense.date) {
			setIsSubmittable(true)
		} else {
			setIsSubmittable(false)
		}
	}

	if (!categories) return <LoadingEffect />

	return (
		<BreezeModal
			title='Add Expense'
			style={{
				maxHeight: '110%',
				overflow: 'auto',
				justifyContent: 'space-evenly',
			}}
			onClose={() => setShowModal((prev) => !prev)}
		>
			<BreezeText
				type='large-heading'
				text='Add Expense'
				style={{
					alignSelf: 'self-start',
				}}
			/>
			<BreezeText
				type='medium'
				text='Expense Name:'
				style={{
					margin: '.25em',
					alignSelf: 'self-start',
				}}
			/>
			<BreezeInput
				type='string'
				title='Expense Name'
				placeholder='name'
				style={{ minWidth: '100%' }}
				onChange={(e) => {
					setExpense({ ...expense, name: e.target.value })
					checkSubmittable()
				}}
			/>
			<BreezeText
				type='medium'
				text='Expense Category:'
				style={{
					margin: '.25em',
					alignSelf: 'self-start',
				}}
			/>
			<BreezeSelect
				title='Category Select'
				options={categories.map((category) => category.name)}
				style={{ minWidth: '100%' }}
				onChange={(e) => {
					const category = categories.find((category) => category.name === e.target.value)
					if (category?.id) {
						setExpense({ ...expense, categoryId: category.id })
						checkSubmittable()
					}
				}}
			/>

			<BreezeText
				type='medium'
				text='Expense Amount:'
				style={{
					margin: '.25em',
					alignSelf: 'self-start',
				}}
			/>
			<BreezeInput
				type='string'
				title='Expense Amount'
				placeholder='amount'
				style={{ minWidth: '100%' }}
				onChange={(e) => {
					setExpense({ ...expense, amount: parseFloat(e.target.value) })
					checkSubmittable()
				}}
			/>

			<BreezeText
				type='medium'
				text='Expense Date:'
				style={{
					margin: '.25em',
					alignSelf: 'self-start',
				}}
			/>
			<BreezeInput
				type='date'
				title='Expense Date'
				placeholder='date'
				defaultValue={dayjs().format('YYYY-MM-DD')}
				style={{ minWidth: '100%' }}
				onChange={(e) => {
					setExpense({ ...expense, date: dayjs(e.target.value).format('YYYY-MM-DD') })
					checkSubmittable()
				}}
			/>

			<BreezeButton
				content='Add Expense'
				disabled={!isSubmittable}
				onClick={() => {
					postMutation.mutate()
					setShowModal((prev) => !prev)
				}}
			/>
		</BreezeModal>
	)
}
