import { useState } from 'react'
import { BreezeBox } from '../../components/shared/BreezeBox'
import { BreezeInput } from '../../components/shared/BreezeInput'
import { BreezeText } from '../../components/shared/BreezeText'
import { useAuth0 } from '@auth0/auth0-react'
import { useBudgetContext } from '../../services/providers/BudgetProvider'
import { BackButton } from '../../components/shared/BackButton'
import { BreezeButton } from '../../components/shared/BreezeButton'
import { BreezeSelect } from '../../components/shared/BreezeSelect'
import { Expense, useExpenses } from '../../services/hooks/ExpenseServices'
import { useMutation } from 'react-query'
import { useNavigate } from 'react-router-dom'

export const AddExpense = () => {
	const { user } = useAuth0()
	const navigate = useNavigate()
	const { postExpense } = useExpenses()
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const postMutation = useMutation((expense: Expense) => postExpense(categories.find((category) => category.id === expense.categoryId)!, expense))
	const { categories, getBudgetForDate } = useBudgetContext()
	const [isSubmittable, setIsSubmittable] = useState(false)
	const [expense, setExpense] = useState<Expense>({
		userId: user?.email ?? '',
		categoryId: categories[0]?.id ?? -1,
		name: '',
		amount: 0,
		year: new Date(Date.now()).getFullYear(),
		month: new Date(Date.now()).getMonth(),
		day: new Date(Date.now()).getDate(),
	})

	const checkSubmittable = () => {
		if (expense.name !== '' && expense.categoryId !== -1 && expense.amount && expense.year && expense.month && expense.day) {
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
						if (category?.id) {
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
					defaultValue={new Date(Date.now()).toISOString().split('T')[0]}
					style={{ width: '100%' }}
					onChange={(e) => {
						setExpense({ ...expense, year: new Date(e.target.value).getFullYear(), month: new Date(e.target.value + 1).getMonth(), day: new Date(e.target.value).getDate() })
						checkSubmittable()
					}}
				/>
			</BreezeBox>
			<BreezeButton
				content='Add Expense'
				disabled={!isSubmittable}
				onClick={() => {
					postMutation.mutate(expense)
					getBudgetForDate(expense.year, expense.month)
					// navigate back using react router
					navigate(-1)
				}}
			/>
		</BreezeBox>
	)
}
