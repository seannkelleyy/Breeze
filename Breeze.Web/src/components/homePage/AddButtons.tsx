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
		<section
			title='Add Buttons'
			className='add-buttons'
		>
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
		</section>
	)
}
