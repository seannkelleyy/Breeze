import { useState } from 'react'
import { BreezeBox } from '../../components/shared/BreezeBox'
import { BreezeInput } from '../../components/shared/BreezeInput'
import { BreezeText } from '../../components/shared/BreezeText'
import { useAuth0 } from '@auth0/auth0-react'
import { useBudgetContext } from '../../services/providers/BudgetProvider'
import { BackButton } from '../../components/shared/BackButton'
import { BreezeButton } from '../../components/shared/BreezeButton'
import { Income, useIncomes } from '../../services/hooks/IncomeServices'
import { useMutation } from 'react-query'
import { useNavigate } from 'react-router-dom'

export const AddIncome = () => {
	const { user } = useAuth0()
	const navigate = useNavigate()
	const { postIncome } = useIncomes()
	const postMutation = useMutation((income: Income) => postIncome(income))
	const { budget } = useBudgetContext()
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

	const checkSubmittable = () => {
		if (income.name !== '' && income.amount && income.year && income.month && income.day) {
			setIsSubmittable(true)
		} else {
			setIsSubmittable(false)
		}
	}

	return (
		<BreezeBox title='Add-Income'>
			<BackButton />
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
					style={{ width: '100%' }}
					placeholder='name'
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
					style={{ width: '100%' }}
					placeholder='amount'
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
					style={{ width: '100%' }}
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
					postMutation.mutate(income)
					navigate(-1)
				}}
			/>
		</BreezeBox>
	)
}
