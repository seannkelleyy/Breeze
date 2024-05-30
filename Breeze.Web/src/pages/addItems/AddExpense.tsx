import { useState } from 'react'
import { BreezeBox } from '../../components/shared/BreezeBox'
import { BreezeInput } from '../../components/shared/BreezeInput'
import { BreezeText } from '../../components/shared/BreezeText'
import { useAuth0 } from '@auth0/auth0-react'
import { useBudget } from '../../services/contexts/BudgetContext'
import { BackButton } from '../../components/shared/BackButton'
import { BreezeButton } from '../../components/shared/BreezeButton'
import { BreezeSelect } from '../../components/shared/BreezeSelect'
import { Expense, useExpenses } from '../../services/hooks/ExpenseServices'

export const AddExpense = () => {
	const { user } = useAuth0()
	const { postExpense } = useExpenses()
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
					}}
				/>
			</BreezeBox>
			<BreezeButton
				text='Add Expense'
				disabled={!isSubmittable}
				onClick={() => {
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					postExpense(categories.find((category) => category.id === expense.categoryId)!, expense)
				}}
			/>
		</BreezeBox>
	)
}
