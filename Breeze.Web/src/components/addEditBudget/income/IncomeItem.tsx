import { useContext, useState } from 'react'
import { Income } from 'models/income'
import { BreezeInput } from '../../shared/BreezeInput'
import { BreezeText } from '../../shared/BreezeText'
import { BudgetContext } from 'services/budgetContext/BudgetContext'
import { BreezeBox } from '../../shared/BreezeBox'

type IncomeItemProps = {
	incomeItem: Income
}
export const IncomeItem = (props: IncomeItemProps) => {
	const { incomeItem } = props
	const budgetContext = useContext(BudgetContext)
	const { UpdateIncome } = budgetContext
	const [incomeAmount, setIncomeAmount] = useState<number>(incomeItem.amount)

	return (
		<BreezeBox
			title='CategoryItem'
			direction='row'
			style={{ justifyContent: 'space-between', width: '100%', borderBottom: '1px solid var(--border)' }}
		>
			<BreezeText
				type='medium'
				text={incomeItem.name}
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
