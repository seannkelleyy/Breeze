import { Link } from 'react-router-dom'
import { Income } from '../../../models/income'
import { BreezeButton } from '../../shared/BreezeButton'
import { BreezeText } from '../../shared/BreezeText'
import { IncomeItem } from './IncomeItem'

type IncomeItemsBoxProps = {
	incomeItems: Income[]
}

export const IncomeItemsBox = (props: IncomeItemsBoxProps) => {
	const { incomeItems } = props

	const addIncome = () => {
		console.log('add income')
	}
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
			<Link to={'/Breeze/Budget/CreateIncome'}>
				<BreezeButton
					text='Add Income'
					onClick={addIncome}
				/>
			</Link>
		</section>
	)
}
