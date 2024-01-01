import { useParams } from 'react-router-dom'
import { BudgetCategory } from './CreateBudgetCategory'
import { BudgetIncome } from './CreateBudgetIncome'
import './addBudget.css'
import { BudgetProvider, useBudget } from '../budget/budgetContext/BudgetContext'

export const AddBudgetPage = () => {
	const { year, month } = useParams<{ year: string; month: string }>()
	const budget = useBudget()

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		console.log(e)
	}

	return (
		<BudgetProvider>
			<div className='page'>
				<h1 className='page-title'>Add Budget</h1>
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
					{budget.incomes.map((income) => (
						<BudgetIncome key={income.id} />
					))}
					{budget.categories.map((category) => (
						<BudgetIncome key={category.id} />
					))}
				</form>
			</div>
		</BudgetProvider>
	)
}
