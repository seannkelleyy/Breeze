import { useContext, useState } from 'react'
import { Income } from '../../../models/income'
import { BreezeInput } from '../../shared/BreezeInput'
import { BudgetContext } from '../../../services/budgetContext/BudgetContext'
import { BreezeBox } from '../../shared/BreezeBox'

export const IncomeItem = (incomeItem: Income) => {
	const budgetContext = useContext(BudgetContext)
	const { UpdateIncome } = budgetContext
	const [incomeAmount, setIncomeAmount] = useState<number>(incomeItem.amount)
	const [incomeName, setIncomeName] = useState<string>(incomeItem.name)

	return (
		<BreezeBox
			title='CategoryItem'
			direction='row'
			style={{ justifyContent: 'space-between', width: '100%', borderBottom: '1px solid var(--border)' }}
		>
			<BreezeInput
				title='Income Name'
				type='string'
				placeholder={incomeName}
				onChange={(e) => setIncomeName(e.target.value)}
				onBlur={() => {
					UpdateIncome(incomeItem)
				}}
				style={{
					textAlign: 'left',
					width: '75%',
				}}
			/>
			<BreezeInput
				title='Income Amount'
				type='number'
				placeholder={incomeAmount.toString()}
				onChange={(e) => setIncomeAmount(e.target.value as unknown as number)}
				onBlur={() => {
					UpdateIncome(incomeItem)
				}}
			/>
		</BreezeBox>
	)
}
