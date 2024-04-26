import { useState } from 'react'
import { BreezeBox } from '../shared/BreezeBox'
import { BreezeInput } from '../shared/BreezeInput'
import { BreezeText } from '../shared/BreezeText'
import { useAuth0 } from '@auth0/auth0-react'
import { useBudget } from '../../services/contexts/BudgetContext'

export const AddIncome = () => {
	const { user } = useAuth0()
	const [income, setIncome] = useState({
		userId: user?.sub,
		budget: useBudget(new Date(Date.now())),
		name: '',
		amount: 0,
		date: '',
	})

	return (
		<BreezeBox title='Add-Income'>
			<h1>Add Income</h1>
			<BreezeBox
				title='Income Name'
				style={{
					width: '80%',
					flexDirection: 'row',
					justifyContent: 'space-between',
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
					onChange={(e) => {
						setIncome({ ...income, name: e.target.value })
						console.log(income)
					}}
				/>
			</BreezeBox>
			<BreezeBox
				title='Income Amount'
				style={{
					width: '80%',
					flexDirection: 'row',
					justifyContent: 'space-between',
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
					onChange={(e) => {
						setIncome({ ...income, amount: parseFloat(e.target.value) })
						console.log(income)
					}}
				/>
			</BreezeBox>
			<BreezeBox
				title='Income Date'
				style={{
					width: '80%',
					flexDirection: 'row',
					justifyContent: 'space-between',
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
					onChange={(e) => {
						setIncome({ ...income, date: e.target.value })
						console.log(income)
					}}
				/>
			</BreezeBox>
		</BreezeBox>
	)
}
