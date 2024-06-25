import { useState } from 'react'
import { BreezeBox } from '../../components/shared/BreezeBox'
import { BreezeInput } from '../../components/shared/BreezeInput'
import { BreezeText } from '../../components/shared/BreezeText'
import { useAuth0 } from '@auth0/auth0-react'
import { useBudgetContext } from '../../services/providers/BudgetProvider'
import { BreezeButton } from '../../components/shared/BreezeButton'
import { useNavigate } from 'react-router-dom'
import { usePostIncome } from '@/services/hooks/income/usePostIncome'
import { Income } from '@/services/hooks/income/incomeServices'
import { BreezeModal } from '@/components/shared/BreezeModal'

type AddIncomeModalProps = {
	showModal: boolean
	setShowModal: (showModal: boolean) => void
}
/**
 * This component is the page where a user can add an expense.
 * @param showModal. A boolean to indicate if the modal is shown.
 * @param setShowModal. A function to set the modal.
 */
export const AddIncomeModal = ({ showModal, setShowModal }: AddIncomeModalProps) => {
	const { user } = useAuth0()
	const navigate = useNavigate()
	const { budget, refetchIncomes } = useBudgetContext()
	const [isSubmittable, setIsSubmittable] = useState(false)
	const [income, setIncome] = useState<Income>({
		userId: user?.email ?? '',
		budgetId: budget.id,
		name: '',
		amount: 0,
		year: new Date(Date.now()).getFullYear(),
		month: new Date(Date.now()).getMonth(),
		day: new Date(Date.now()).getDate(),
	})

	const postMutation = usePostIncome({
		income: income,
		onSettled: () => {
			refetchIncomes()
		},
	})

	const checkSubmittable = () => {
		if (income.name !== '' && income.amount && income.year && income.month && income.day) {
			setIsSubmittable(true)
		} else {
			setIsSubmittable(false)
		}
	}

	return (
		<BreezeModal
			title='Add Expense'
			showModal={showModal}
			onClose={() => setShowModal(!showModal)}
		>
			<BreezeText
				type='large-heading'
				text='Add Income'
				style={{ marginTop: '12.5%' }}
			/>
			<BreezeBox
				title='Income Name'
				style={{
					width: '80%',
					flexDirection: 'column',
					alignItems: 'flex-start',
				}}
			>
				<BreezeText
					type='medium'
					text='Income Name:'
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
			</BreezeBox>
			<BreezeBox
				title='Income Amount'
				style={{
					width: '80%',
					flexDirection: 'column',
					alignItems: 'flex-start',
				}}
			>
				<BreezeText
					type='medium'
					text='Income Amount:'
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
			</BreezeBox>
			<BreezeBox
				title='Income Date'
				style={{
					width: '80%',
					flexDirection: 'column',
					alignItems: 'flex-start',
				}}
			>
				<BreezeText
					type='medium'
					text='Income Date:'
				/>
				<BreezeInput
					type='date'
					title='Income Date'
					placeholder='date'
					defaultValue={new Date(Date.now()).toISOString().split('T')[0]}
					style={{ minWidth: '100%' }}
					onChange={(e) => {
						setIncome({ ...income, year: new Date(e.target.value).getFullYear(), month: new Date(e.target.value).getMonth(), day: new Date(e.target.value).getDate() })
						checkSubmittable()
					}}
				/>
			</BreezeBox>
			<BreezeButton
				content='Add Income'
				disabled={!isSubmittable}
				onClick={() => {
					postMutation.mutate()
					navigate(-1)
				}}
			/>
		</BreezeModal>
	)
}
