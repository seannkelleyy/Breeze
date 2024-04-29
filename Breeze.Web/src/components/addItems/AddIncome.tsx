import { useState } from 'react'
import { BreezeBox } from '../shared/BreezeBox'
import { BreezeInput } from '../shared/BreezeInput'
import { BreezeText } from '../shared/BreezeText'
import { useAuth0 } from '@auth0/auth0-react'
import { useBudget } from '../../services/contexts/BudgetContext'
import { BackButton } from '../shared/BackButton'
import { BreezeButton } from '../shared/BreezeButton'
import { postIncome } from '../../services/hooks/IncomeServices'
import { Income } from '../../services/models/income'

export const AddIncome = () => {
	const { user } = useAuth0()
	const [income, setIncome] = useState<Income>({
		userId: user?.sub,
		budgetId: useBudget(new Date(Date.now())).id,
		name: '',
		amount: 0,
		date: new Date(Date.now()),
	})
	const [isSubmittable, setIsSubmittable] = useState(false)

	const checkSubmittable = () => {
		if (income.name !== '' && income.amount && income.date !== null) {
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
						console.log(income)
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
						console.log(income)
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
					style={{ width: '100%' }}
					onChange={(e) => {
						setIncome({ ...income, date: new Date(e.target.value) })
						checkSubmittable()
						console.log(income)
					}}
				/>
			</BreezeBox>
			<BreezeButton
				text='Add Income'
				disabled={!isSubmittable}
				onClick={() => {
					console.log(income)
					postIncome(income)
				}}
			/>
		</BreezeBox>
	)
}
