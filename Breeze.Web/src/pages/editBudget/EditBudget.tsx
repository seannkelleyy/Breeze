import { useParams } from 'react-router-dom'
import { IncomeItemsBox } from './income/IncomeItemsBox'
import { CategoryItemsBox } from './category/CategoryItemBox'
import { BreezeBox } from '../../components/shared/BreezeBox'
import { BreezeText } from '../../components/shared/BreezeText'
import { BreezeCard } from '../../components/shared/BreezeCard'
import { useState } from 'react'
import { BackButton } from '../../components/shared/BackButton'
import { useDateContext } from '../../services/providers/DateProvider'
import { useFetchBudget } from '@/services/hooks/budget/useFetchBudget'

/**
 * This is the page that allows a user to add or edit a budget.
 */
export const EditBudgetPage = () => {
	const { year, month } = useParams<{ year: string; month: string }>()
	const { getMonthAsString } = useDateContext()
	// TODO use budget context
	const { data, status } = useFetchBudget({
		year: parseInt(year as string),
		month: parseInt(month as string),
	})
	const [monthlyIncome, setMonthlyIncome] = useState(0)
	const [monthlyExpenses, setMonthlyExpenses] = useState(0)

	return (
		<BreezeBox title='Edit Budget'>
			<BackButton />
			<BreezeText
				type='large-heading'
				text='Edit Budget'
			/>
			<BreezeCard
				title='Budget Headlines'
				style={{
					position: 'sticky',
					top: 0,
					gap: '.15em',
					padding: '.6em',
					minWidth: '60%',
				}}
			>
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
						text={`Remaining: $${monthlyExpenses ? monthlyIncome - monthlyExpenses : 0}`}
					/>
				</section>
			</BreezeCard>
			<BreezeBox
				title='Budget Items'
				style={{
					width: '85%',
				}}
			>
				{data ? (
					<>
						<IncomeItemsBox setIncome={setMonthlyIncome} />
						<CategoryItemsBox setExpenses={setMonthlyExpenses} />
					</>
				) : status === 'loading' ? (
					<BreezeText
						type='large'
						text='Loading...'
					/>
				) : (
					<BreezeText
						type='large'
						text='Error loading budget'
					/>
				)}
			</BreezeBox>
		</BreezeBox>
	)
}
