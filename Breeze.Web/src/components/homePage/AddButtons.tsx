import { BreezeBox } from '../shared/BreezeBox'
import { BreezeButton } from '../shared/BreezeButton'
import './homePage.css'

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
				// TODO: Make large size
			/>
			<BreezeButton
				onClick={handleNewIncome}
				text='Add New Income'
				// TODO: Make large size
			/>
		</BreezeBox>
	)
}
