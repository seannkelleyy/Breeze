import { useState } from 'react'
import { BreezeBox } from '../shared/BreezeBox'
import { BreezeInput } from '../shared/BreezeInput'
import { BreezeText } from '../shared/BreezeText'
import { useAuth0 } from '@auth0/auth0-react'
import { useBudget } from '../../services/contexts/BudgetContext'
import { BackButton } from '../shared/BackButton'
import { BreezeButton } from '../shared/BreezeButton'
import { postIncome } from '../../services/hooks/IncomeServices'
import { Expense } from '../../services/models/expense'
import { BreezeSelect } from '../shared/BreezeSelect'

export const AddExpense = () => {
	const { user } = useAuth0()
	const [expense, setExpense] = useState<Expense>({
		userId: user?.sub,
		categoryId: -1,
		name: '',
		amount: 0,
		date: new Date(Date.now()),
	})
	const categories = useBudget(new Date(Date.now())).categories
	const [isSubmittable, setIsSubmittable] = useState(false)

	const checkSubmittable = () => {
		if (expense.name !== '' && expense.categoryId !== -1 && expense.amount && expense.date !== (null || undefined)) {
			setIsSubmittable(true)
		} else {
			setIsSubmittable(false)
		}
	}

	return (
		<BreezeBox title='Add-Expense'>
			<BackButton />
			<BreezeText
				type='large-heading'
				text='Add Expense'
				style={{ marginTop: '12.5%' }}
			/>
			<BreezeBox
				title='Expense Name'
				style={{
					width: '80%',
					flexDirection: 'column',
					alignItems: 'flex-start',
				}}
			>
				<BreezeText
					type='medium'
					text='Expense Name:'
				/>
				<BreezeInput
					type='string'
					title='Expense Name'
					style={{ width: '100%' }}
					placeholder='name'
					onChange={(e) => {
						setExpense({ ...expense, name: e.target.value })
						checkSubmittable()
						console.log(expense)
					}}
				/>
			</BreezeBox>
			<BreezeBox
				title='Expense Category'
				style={{
					width: '80%',
					flexDirection: 'column',
					alignItems: 'flex-start',
				}}
			>
				<BreezeText
					type='medium'
					text='Expense Category:'
				/>
				<BreezeSelect
					title='Category Select'
					options={categories.map((category) => category.name)}
					onChange={(e) => {
						const category = categories.find((category) => category.name === e.target.value)
						if (category) {
							setExpense({ ...expense, categoryId: category.id })
							checkSubmittable()
							console.log(expense)
						}
					}}
					style={{ width: '100%' }}
				/>
			</BreezeBox>
			<BreezeBox
				title='Expense Amount'
				style={{
					width: '80%',
					flexDirection: 'column',
					alignItems: 'flex-start',
				}}
			>
				<BreezeText
					type='medium'
					text='Expense Amount:'
				/>
				<BreezeInput
					type='string'
					title='Expense Amount'
					style={{ width: '100%' }}
					placeholder='amount'
					onChange={(e) => {
						setExpense({ ...expense, amount: parseFloat(e.target.value) })
						checkSubmittable()
						console.log(expense)
					}}
				/>
			</BreezeBox>
			<BreezeBox
				title='Expense Date'
				style={{
					width: '80%',
					flexDirection: 'column',
					alignItems: 'flex-start',
				}}
			>
				<BreezeText
					type='medium'
					text='Expense Date:'
				/>
				<BreezeInput
					type='date'
					title='Expense Date'
					placeholder='date'
					style={{ width: '100%' }}
					onChange={(e) => {
						setExpense({ ...expense, date: new Date(e.target.value) })
						checkSubmittable()
						console.log(expense)
					}}
				/>
			</BreezeBox>
			<BreezeButton
				text='Add Expense'
				disabled={!isSubmittable}
				onClick={() => {
					console.log(expense)
					postIncome(expense)
				}}
			/>
		</BreezeBox>
	)
}
