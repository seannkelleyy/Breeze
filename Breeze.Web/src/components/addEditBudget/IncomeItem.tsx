import { useState } from 'react'
import { Income } from '../../models/income'
import { useBudget } from '../../services/budgetContext/BudgetContext'
import { BreezeInput } from '../shared/BreezeInput'
import { BreezeText } from '../shared/BreezeText'

type IncomeItemProps = {
	incomeItem: Income
}
export const IncomeItem = (props: IncomeItemProps) => {
	const { incomeItem } = props
	const budgetContext = useBudget()
	const [incomeAmount, setIncomeAmount] = useState<number>(incomeItem.amount)

	return (
		<section className='budget-item'>
			<BreezeText text={incomeItem.name} />
			<BreezeInput
				title='Income Amount'
				type='number'
				placeholder={incomeAmount.toString()}
				onChange={(e) => setIncomeAmount(e.target.value as unknown as number)}
				onBlur={() => {
					budgetContext.updateIncome(incomeItem)
				}}
			/>
		</section>
	)
}
