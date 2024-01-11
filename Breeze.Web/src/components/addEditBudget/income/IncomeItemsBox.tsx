import { Link } from 'react-router-dom'
import { Income } from '../../../models/income'
import { BreezeButton } from '../../shared/BreezeButton'
import { BreezeText } from '../../shared/BreezeText'
import { IncomeItem } from './IncomeItem'
import { BreezeBox } from '../../shared/BreezeBox'

type IncomeItemsBoxProps = {
	incomeItems: Income[]
}

export const IncomeItemsBox = (props: IncomeItemsBoxProps) => {
	const { incomeItems } = props

	const addIncome = () => {
		console.log('add income')
	}
	return (
		<BreezeBox
			title='incomes'
			style={{
				border: 'var(--border) solid 2px',
				padding: '0.5em',
				borderRadius: '0.5em',
				width: '100%',
			}}
		>
			<BreezeText
				type='small-heading'
				text='Incomes'
			/>
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
		</BreezeBox>
	)
}
