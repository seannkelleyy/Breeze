import { useBudgetContext } from '../../services/providers/BudgetProvider'
import { Card } from '../../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { CreateIncomeDialog } from './dialogs/incomes/CreateIncomeDialog'
import { CreateBudgetDialog } from '../budget/CreateBudgetDialog'
import { Goals } from '../goals/Goals'
import { IncomeTable } from './dataTables/IncomeTable'
import { ExpensesTable } from './dataTables/ExpenseTable'
import dayjs from 'dayjs'
import { EditBudgetDialog } from '../budget/EditBudgetDialog'
import { CreateExpenseDialog } from './dialogs/expenses/CreateExpenseDialog'

export const Dashboard = () => {
	const { budget, getBudgetForDate } = useBudgetContext()
	const today = new Date()

	const getNextBudget = () => {
		if (today.getMonth() === 11) {
			getBudgetForDate(today.getFullYear() + 1, 0)
		} else {
			getBudgetForDate(today.getFullYear(), today.getMonth() + 1)
		}
	}

	const getPreviousBudget = () => {
		if (today.getMonth() === 0) {
			getBudgetForDate(today.getFullYear() - 1, 11)
		} else {
			getBudgetForDate(today.getFullYear(), today.getMonth() - 1)
		}
	}

	const budgetDifference = parseFloat((budget?.monthlyIncome - budget?.monthlyExpenses).toFixed(2)) ?? 'Loading...'

	return (
		<Card className='absolute left-1/2 transform -translate-x-1/2 overflow-x-hidden flex flex-col gap-1 justify-start items-center p-4'>
			<h1 className='text-3xl font-bold'>{dayjs(budget?.date).format('MMMM YYYY')}</h1>
			<h2 className='text-lg'>
				Income: $ <span className='text-accent'>{budget?.monthlyIncome?.toFixed(2) ?? 'Loading...'}</span>
			</h2>
			<h2 className='text-lg'>
				Expenses: $ <span className='text-accent'>{budget?.monthlyExpenses?.toFixed(2) ?? 'Loading...'}</span>
			</h2>
			<h2 className='text-lg'>
				Difference: $ <span className={budgetDifference > 0 ? 'p-1 rounded-sm bg-success' : ' p-1 rounded-sm bg-destructive'}>{budgetDifference}</span>
			</h2>
			<div className='flex gap-4 pt-4'>
				<CreateIncomeDialog />
				<CreateExpenseDialog />
				{budget ? <EditBudgetDialog /> : <CreateBudgetDialog />}
			</div>
			<Goals />
			<Tabs
				defaultValue='expenses'
				className='flex flex-col justify-center items-center mt-4'
			>
				<TabsList>
					<TabsTrigger value='expenses'>Expenses</TabsTrigger>
					<TabsTrigger value='income'>Incomes</TabsTrigger>
				</TabsList>
				<TabsContent value='expenses'>
					<ExpensesTable />
				</TabsContent>
				<TabsContent value='income'>
					<IncomeTable />
				</TabsContent>
			</Tabs>
		</Card>
	)
}

