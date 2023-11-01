import React, { useState } from 'react'

type BudgetIncomeProps = {
	setTotalIncome: (income: number) => void
}

const BudgetIncome = (props: BudgetIncomeProps) => {
	return (
		<>
			<h3>Income</h3>
			<label htmlFor='income-name'>Income Name:</label>
			<input
				type='text'
				id='income-name'
			/>
			<label htmlFor='income-amount'>Amount:</label>
			<input
				type='number'
				id='income-amount'
				onChange={(e) => {
					props.setTotalIncome(parseInt(e.target.value))
				}}
			/>
		</>
	)
}

export default BudgetIncome
