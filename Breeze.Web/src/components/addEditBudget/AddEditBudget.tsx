import { useParams } from 'react-router-dom'
import { CategoryItem } from './CategoryItem'
import { IncomeItem } from './IncomeItem'
import './addEditBudget.css'
import { BudgetProvider, useBudget } from '../../services/budgetContext/BudgetContext'
import { IncomeItemsBox } from './IncomeItemsBox'

export const AddBudgetPage = () => {
	const { year, month } = useParams<{ year: string; month: string }>()
	const budgetContext = useBudget()

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
					<h3>Income: ${budgetContext.budget.monthlyIncome}</h3>
					<h3>Expenses: ${budgetContext.budget.monthlyExpenses}</h3>
					<div className={budgetContext.budget.monthlyIncome - budgetContext.budget.monthlyExpenses >= 0 ? 'amount-left-positive' : 'amount-left-negative'}>
						<h3>
							Amount left to allocate: $
							{budgetContext.budget.monthlyIncome && budgetContext.budget.monthlyExpenses ? budgetContext.budget.monthlyIncome - budgetContext.budget.monthlyExpenses : 0}
						</h3>
					</div>
				</section>
				<form
					className='budget-creation-form'
					onSubmit={handleSubmit}
				>
					<IncomeItemsBox incomeItems={budgetContext.budget.incomes} />
					{budgetContext.budget.categories.map((category) => (
						<CategoryItem
							key={category.id}
							categoryItem={category}
						/>
					))}
				</form>
			</div>
		</BudgetProvider>
	)
}
