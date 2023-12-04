type BudgetIncomeProps = {
	setTotalIncome: (income: number) => void
}

const BudgetIncome = (props: BudgetIncomeProps) => {
	return (
		<section className='section-add-container'>
			<h3>Income</h3>
			<label htmlFor='income-name'>Income Name:</label>
			<input
				className='breeze-input'
				type='text'
				id='income-name'
			/>
			<label htmlFor='income-amount'>Amount:</label>
			<input
				className='breeze-input'
				type='number'
				id='income-amount'
				onChange={(e) => {
					props.setTotalIncome(parseInt(e.target.value))
				}}
			/>
		</section>
	)
}

export default BudgetIncome
