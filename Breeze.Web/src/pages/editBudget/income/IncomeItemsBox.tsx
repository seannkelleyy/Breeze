import { BreezeButton } from '../../../components/shared/BreezeButton'
import { BreezeText } from '../../../components/shared/BreezeText'
import { IncomeItem } from './IncomeItem'
import { BreezeBox } from '../../../components/shared/BreezeBox'
import { useEffect, useState } from 'react'
import { Income } from '../../../services/hooks/IncomeServices'
import { useAuth0 } from '@auth0/auth0-react'
import { useBudgetContext } from '../../../services/contexts/BudgetContext'

type IncomeItemsBoxProps = {
	incomeItems: Income[]
}

export const IncomeItemsBox = ({ incomeItems }: IncomeItemsBoxProps) => {
	const { user } = useAuth0()
	const { budget } = useBudgetContext()
	const [items, setItems] = useState<Income[]>(incomeItems)

	useEffect(() => {
		setItems(incomeItems)
	}, [incomeItems])

	const addIncome = () => {
		const emptyIncome: Income = {
			userEmail: user?.email ?? '',
			budgetId: budget.id,
			name: '',
			amount: 0,
			year: new Date(Date.now()).getFullYear(),
			month: new Date(Date.now()).getMonth(),
			day: new Date(Date.now()).getDate(),
		}
		setItems([...items, emptyIncome])
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
			{items.map((income, index) => (
				<IncomeItem
					key={index}
					incomeItem={income}
				/>
			))}

			<BreezeButton
				text='Add Income'
				onClick={addIncome}
			/>
		</BreezeBox>
	)
}
