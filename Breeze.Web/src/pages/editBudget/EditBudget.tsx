import { useParams } from 'react-router-dom'
import { useBudgetContext } from '../../services/contexts/BudgetContext'
import { IncomeItemsBox } from './income/IncomeItemsBox'
import { CategoryItemsBox } from './category/CategoryItemBox'
import { BreezeBox } from '../../components/shared/BreezeBox'
import { BreezeText } from '../../components/shared/BreezeText'
import { BreezeCard } from '../../components/shared/BreezeCard'
import './editBudget.css'
import { useEffect } from 'react'

/**
 * This is the page that allows a user to add or edit a budget.
 */
export const EditBudgetPage = () => {
	const { year, month } = useParams<{ year: string; month: string }>()
	const { budget, getBudgetForDate } = useBudgetContext()

	useEffect(() => {
		const date = new Date(parseInt(year as string), parseInt(month as string))
		getBudgetForDate(date)
	}, [year, month, getBudgetForDate])

	return (
		<BreezeBox title='Edit Budget'>
			<BreezeText
				type='large-heading'
				text='Edit Budget'
			/>
			<BreezeCard title='Budget Headlines'>
				<BreezeText
					type='large'
					text={`Date: ${month} ${year}`}
				/>
				<BreezeText
					type='large'
					text={`Income: $${budget.monthlyIncome}`}
				/>
				<BreezeText
					type='large'
					text={`Expenses: $${budget.monthlyExpenses}`}
				/>
				<section className={budget.monthlyIncome - budget.monthlyExpenses >= 0 ? 'amount-left-positive' : 'amount-left-negative'}>
					<BreezeText
						type='large'
						style={{
							padding: '.25em',
						}}
						text={`Amount left to allocate: $${budget.monthlyIncome && budget.monthlyExpenses ? budget.monthlyIncome - budget.monthlyExpenses : 0}`}
					/>
				</section>
			</BreezeCard>
			<BreezeBox
				title='Budget Items'
				style={{
					width: '85%',
				}}
			>
				<IncomeItemsBox incomeItems={budget.incomes} />
				<CategoryItemsBox categoryItems={budget.categories} />
			</BreezeBox>
		</BreezeBox>
	)
}
