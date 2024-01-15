import { BreezeBox } from '../shared/BreezeBox'
import { BreezeButton } from '../shared/BreezeButton'

/**
 * Simple component that holds the add expense and add income buttons
 */
export const AddButtons = () => {
	const handleNewExpense = () => {
		console.log('New Expense')
	}

	const handleNewIncome = () => {
		console.log('New Income')
	}
	return (
		<BreezeBox title='Add Buttons'>
			<BreezeButton
				onClick={handleNewExpense}
				text='Add New Expense'
				size='large'
			/>
			<BreezeButton
				onClick={handleNewIncome}
				text='Add New Income'
				size='large'
			/>
		</BreezeBox>
	)
}
