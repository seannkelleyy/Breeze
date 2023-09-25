import './homePage.css'

const AddButtons = () => {
	const handleNewExpense = () => {
		console.log('New Expense')
	}

	const handleNewIncome = () => {
		console.log('New Income')
	}
	return (
		<>
			<button
				className='expense-button'
				onClick={handleNewExpense}
			>
				Add New Expense
			</button>
			<button
				className='income-button'
				onClick={handleNewIncome}
			>
				Add New Income
			</button>
		</>
	)
}

export default AddButtons
