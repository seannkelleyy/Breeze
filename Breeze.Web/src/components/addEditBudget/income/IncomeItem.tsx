import { useContext, useState } from 'react'
import { Income } from '../../../models/income'
import { BreezeInput } from '../../shared/BreezeInput'
import { BreezeText } from '../../shared/BreezeText'
import { BudgetContext } from '../../../services/budgetContext/BudgetContext'

type IncomeItemProps = {
	incomeItem: Income
}
export const IncomeItem = (props: IncomeItemProps) => {
	const { incomeItem } = props
	const budgetContext = useContext(BudgetContext)
	const { UpdateIncome } = budgetContext
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
					UpdateIncome(incomeItem)
				}}
			/>
		</section>
	)
}
