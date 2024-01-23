import { useContext, useState } from 'react'
import { Income } from '../../../models/income'
import { BreezeInput } from '../../shared/BreezeInput'
import { BudgetContext } from '../../../services/budgetContext/BudgetContext'
import { BreezeBox } from '../../shared/BreezeBox'

type IncomeItemProps = {
	incomeItem: Income
}

export const IncomeItem = ({ incomeItem }: IncomeItemProps) => {
	const budgetContext = useContext(BudgetContext)
	const { UpdateIncome } = budgetContext
	const [incomeAmount, setIncomeAmount] = useState<number>(incomeItem.amount)
	const [incomeName, setIncomeName] = useState<string>(incomeItem.name)

	const UpdateIncomeFunction = (income: Income) => {
		income.amount = incomeAmount
		income.name = incomeName
		UpdateIncome(income)
	}
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
					UpdateIncomeFunction(incomeItem)
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
