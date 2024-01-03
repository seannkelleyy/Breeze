import { Income } from '../../models/income'
import { BreezeText } from '../shared/BreezeText'
import { IncomeItem } from './IncomeItem'
import './addEditBudget.css'

type IncomeItemsBoxProps = {
	incomeItems: Income[]
}

export const IncomeItemsBox = (props: IncomeItemsBoxProps) => {
	const { incomeItems } = props

	return (
		<section
			title='incomes'
			className='item-box'
		>
			<BreezeText text='Incomes' />
			{incomeItems.map((income) => (
				<IncomeItem
					key={income.id}
					incomeItem={income}
				/>
			))}
		</section>
	)
}
