import dayjs from 'dayjs'
import { useBudgetContext } from '../services/providers/BudgetProvider'
import { BudgetCarousel } from '../components/dashboard/BudgetCarousel'
import { useMsal } from '@azure/msal-react'

export const Dashboard = () => {
	const today = dayjs().format('dddd, MMMM D, YYYY')
	const { budget, totalSpent, categories, getBudgetForDate, refetchCategories } = useBudgetContext()

	const { instance } = useMsal()
	const accounts = instance.getAllAccounts()
	return (
		<section
			title='Dashboard'
			className='h-screen w-screen flex flex-col justify-center items-center mt-40'
		>
			<h1 className='text-3xl mb-4'>{today}</h1>
			<h2>Welcome {accounts[0].name}</h2>
			<h2>
				Spent so far: $ <span className='text-accent'>{totalSpent.toFixed(2)}</span>
			</h2>
			<h2>
				Remaining: $ <span className='text-accent'>{(budget.monthlyIncome - budget.monthlyExpenses).toFixed(2)}</span>
			</h2>
			<BudgetCarousel />
		</section>
	)
}

