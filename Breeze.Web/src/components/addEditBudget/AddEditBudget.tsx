import { useParams } from 'react-router-dom'
import './addEditBudget.css'
import { useBudget } from '../../services/budgetContext/BudgetContext'
import { IncomeItemsBox } from './IncomeItemsBox'
import { CategoryItemsBox } from './CategoryItemBox'
import { emptyBudget } from '../../models/budget'

export const AddBudgetPage = () => {
	const { year, month } = useParams<{ year: string; month: string }>()
	const date = new Date(parseInt(year as string), parseInt(month as string))
	const budgetContext = useBudget(date)
	const budget = budgetContext ? budgetContext : emptyBudget

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		console.log(e)
	}

	return (
		<div className='page'>
			<h1 className='page-title'>Edit Budget</h1>
			<section className='budget-creation-progress'>
				<h3>
					Date: {month} {year}
				</h3>
				<h3>Income: ${budget.monthlyIncome}</h3>
				<h3>Expenses: ${budget.monthlyExpenses}</h3>
				<div className={budget.monthlyIncome - budget.monthlyExpenses >= 0 ? 'amount-left-positive' : 'amount-left-negative'}>
					<h3>Amount left to allocate: ${budget.monthlyIncome && budget.monthlyExpenses ? budget.monthlyIncome - budget.monthlyExpenses : 0}</h3>
				</div>
			</section>
			<form
				className='budget-creation-form'
				onSubmit={handleSubmit}
			>
				<IncomeItemsBox incomeItems={budget.incomes} />
				<CategoryItemsBox CategoryItems={budget.categories} />
			</form>
		</div>
	)
}
