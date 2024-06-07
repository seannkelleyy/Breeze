import { useParams } from 'react-router-dom'
import { useBudgetContext } from '../../services/providers/BudgetProvider'
import { IncomeItemsBox } from './income/IncomeItemsBox'
import { CategoryItemsBox } from './category/CategoryItemBox'
import { BreezeBox } from '../../components/shared/BreezeBox'
import { BreezeText } from '../../components/shared/BreezeText'
import { BreezeCard } from '../../components/shared/BreezeCard'
import { useEffect, useState } from 'react'
import { BackButton } from '../../components/shared/BackButton'
import './editBudget.css'
import { useDateContext } from '../../services/providers/DateProvider'

/**
 * This is the page that allows a user to add or edit a budget.
 */
export const EditBudgetPage = () => {
	const { year, month } = useParams<{ year: string; month: string }>()
	const { getMonthAsString } = useDateContext()
	const { budget, getBudgetForDate } = useBudgetContext()
	const [monthlyIncome, setMonthlyIncome] = useState(0)
	const [monthlyExpenses, setMonthlyExpenses] = useState(0)

	useEffect(() => {
		const date = new Date(parseInt(year as string), parseInt(month as string))
		getBudgetForDate(date)
		console.log(budget)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [year, month])

	// TODO: Make it so the top card is fixed and the bottom box scrolls
	return (
		<BreezeBox title='Edit Budget'>
			<BackButton />
			<BreezeText
				type='large-heading'
				text='Edit Budget'
			/>
			<BreezeCard title='Budget Headlines'>
				<BreezeText
					type='large'
					text={`Date: ${getMonthAsString(parseInt(month as string))} ${year}`}
				/>
				<BreezeText
					type='large'
					text={`Income: $${monthlyIncome}`}
				/>
				<BreezeText
					type='large'
					text={`Expenses: $${monthlyExpenses}`}
				/>
				<section className={monthlyIncome - monthlyExpenses >= 0 ? 'amount-left-positive' : 'amount-left-negative'}>
					<BreezeText
						type='large'
						style={{
							padding: '.25em',
						}}
						text={`Amount left to allocate: $${monthlyExpenses ? monthlyIncome - monthlyExpenses : 0}`}
					/>
				</section>
			</BreezeCard>
			<BreezeBox
				title='Budget Items'
				style={{
					width: '85%',
				}}
			>
				<IncomeItemsBox
					incomeItems={budget.incomes}
					setIncome={setMonthlyIncome}
				/>
				<CategoryItemsBox
					categoryItems={budget.categories}
					setExpenses={setMonthlyExpenses}
				/>
			</BreezeBox>
		</BreezeBox>
	)
}
