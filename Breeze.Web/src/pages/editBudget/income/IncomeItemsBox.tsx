import { BreezeButton } from '../../../components/shared/BreezeButton'
import { BreezeText } from '../../../components/shared/BreezeText'
import { IncomeItem } from './IncomeItem'
import { BreezeBox } from '../../../components/shared/BreezeBox'
import { useState } from 'react'
import { Income, useIncomes } from '../../../services/hooks/IncomeServices'
import { useAuth0 } from '@auth0/auth0-react'
import { useBudgetContext } from '../../../services/contexts/BudgetContext'

type IncomeItemsBoxProps = {
	incomeItems: Income[]
}

export const IncomeItemsBox = ({ incomeItems }: IncomeItemsBoxProps) => {
	const { postIncome } = useIncomes()
	const { user } = useAuth0()
	const { budget, getBudgetForDate } = useBudgetContext()
	const [items, setItems] = useState<Income[]>(incomeItems ?? [])

	const addIncome = () => {
		console.log('addIncome ' + budget.id)
		console.log(items)

		const newIncome: Income = {
			userId: user?.email ?? '',
			budgetId: budget.id,
			name: '',
			amount: 0,
			year: new Date(Date.now()).getFullYear(),
			month: new Date(Date.now()).getMonth() + 1,
			day: new Date(Date.now()).getDate(),
		}
		postIncome(newIncome)
		setItems([...items, newIncome])
	}

	return (
		<BreezeBox
			title='incomes'
			style={{
				padding: '0.5em',
				borderRadius: '0.5em',
				width: '100%',
			}}
		>
			<BreezeText
				type='small-heading'
				text='Incomes'
			/>
			{items &&
				items.map((income, index) => (
					<IncomeItem
						key={index}
						incomeItem={income}
						onUpdate={(income: Income) => {
							const newItems = items.map((item) => {
								if (item.id === income.id) {
									return income
								}
								return item
							})
							setItems(newItems)
						}}
					/>
				))}

			<BreezeButton
				text='Add Income'
				onClick={addIncome}
			/>
		</BreezeBox>
	)
}
