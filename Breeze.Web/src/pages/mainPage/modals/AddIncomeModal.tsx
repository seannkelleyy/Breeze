import { useState } from 'react'
import { BreezeInput } from '../../../components/shared/BreezeInput'
import { BreezeText } from '../../../components/shared/BreezeText'
import { useAuth0 } from '@auth0/auth0-react'
import { useBudgetContext } from '../../../services/providers/BudgetProvider'
import { BreezeButton } from '../../../components/shared/BreezeButton'
import { usePostIncome } from '@/services/hooks/income/usePostIncome'
import { Income } from '@/services/hooks/income/incomeServices'
import { BreezeModal } from '@/components/shared/BreezeModal'
import dayjs from 'dayjs'
import { LoadingEffect } from '@/components/shared/LoadingEffect'

type AddIncomeModalProps = {
	setShowModal: (showModal: boolean | ((prevShowModal: boolean) => boolean)) => void
}
/**
 * This component is the page where a user can add an expense.
 * @param setShowModal. A function to set the modal.
 */
export const AddIncomeModal = ({ setShowModal }: AddIncomeModalProps) => {
	const { user } = useAuth0()
	const { budget, refetchIncomes, refetchBudget } = useBudgetContext()
	const [isSubmittable, setIsSubmittable] = useState(false)
	const [income, setIncome] = useState<Income>({
		userId: user?.email ?? '',
		budgetId: budget.id,
		name: '',
		amount: 0,
		date: dayjs().format('YYYY-MM-DD'),
	})

	const postMutation = usePostIncome({
		income: income,
		onSettled: () => {
			refetchBudget()
			refetchIncomes()
		},
	})

	const checkSubmittable = () => {
		if (income.name !== '' && income.amount && income.date) {
			setIsSubmittable(true)
		} else {
			setIsSubmittable(false)
		}
	}

	if (!budget) return <LoadingEffect />

	return (
		<BreezeModal
			title='Add Expense'
			style={{
				maxHeight: '100%',
				overflow: 'auto',
				justifyContent: 'space-evenly',
			}}
			onClose={() => setShowModal((prev) => !prev)}
		>
			<BreezeText
				type='large-heading'
				text='Add Income'
				style={{
					alignSelf: 'self-start',
				}}
			/>

			<BreezeText
				type='medium'
				text='Income Name:'
				style={{
					margin: '.25em',
					alignSelf: 'self-start',
				}}
			/>
			<BreezeInput
				type='string'
				title='Income Name'
				placeholder='name'
				style={{ minWidth: '100%' }}
				onChange={(e) => {
					setIncome({ ...income, name: e.target.value })
					checkSubmittable()
				}}
			/>

			<BreezeText
				type='medium'
				text='Income Amount:'
				style={{
					margin: '.25em',
					alignSelf: 'self-start',
				}}
			/>
			<BreezeInput
				type='string'
				title='Income Amount'
				placeholder='amount'
				style={{ minWidth: '100%' }}
				onChange={(e) => {
					setIncome({ ...income, amount: parseFloat(e.target.value) })
					checkSubmittable()
				}}
			/>

			<BreezeText
				type='medium'
				text='Income Date:'
				style={{
					margin: '.25em',
					alignSelf: 'self-start',
				}}
			/>
			<BreezeInput
				type='date'
				title='Income Date'
				placeholder='date'
				defaultValue={dayjs().format('YYYY-MM-DD')}
				style={{ minWidth: '100%' }}
				onChange={(e) => {
					setIncome({ ...income, date: dayjs(e.target.value).format('YYYY-MM-DD') })
					checkSubmittable()
				}}
			/>
			<BreezeButton
				content='Add Income'
				disabled={!isSubmittable}
				onClick={() => {
					postMutation.mutate()
					setShowModal((prev) => !prev)
				}}
			/>
		</BreezeModal>
	)
}
