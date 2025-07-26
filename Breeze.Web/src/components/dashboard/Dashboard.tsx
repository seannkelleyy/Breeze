import dayjs from 'dayjs'
import { MoveLeft, MoveRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { useBudgetContext } from '../../services/providers/BudgetProvider'
import { BudgetDialog } from '../budget/BudgetDialog'
import { Goals } from '../goals/Goals'
import { ExpensesTable } from './dataTables/ExpenseTable'
import { IncomeTable } from './dataTables/IncomeTable'
import { ExpenseDialog } from './dialogs/ExpenseDialog'
import { IncomeDialog } from './dialogs/IncomeDialog'

export const Dashboard = () => {
	const { budget, getBudgetForDate } = useBudgetContext()
	const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
	const [currentYear, setCurrentYear] = useState(new Date().getFullYear())

	useEffect(() => {
		getBudgetForDate(currentYear, currentMonth)
		console.log('Budget for date:', currentYear, currentMonth)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentMonth, currentYear])

	const getNextBudget = () => {
		if (currentMonth === 11) {
			setCurrentMonth(0)
			setCurrentYear(currentYear + 1)
		} else {
			setCurrentMonth(currentMonth + 1)
		}
	}

	const getPreviousBudget = () => {
		if (currentMonth === 0) {
			setCurrentMonth(11)
			setCurrentYear(currentYear - 1)
		} else {
			setCurrentMonth(currentMonth - 1)
		}
	}

	const budgetDifference = (budget?.monthlyIncome ?? 0) - (budget?.monthlyExpenses ?? 0)

	return (
		<div className='text-center pt-[10vh] py-4 px-96 rounded-[.5rem] overflow-x-hidden flex flex-col gap-1 justify-start items-center '>
			<div className='flex gap-4 mb-4'>
				<Button
					onClick={getPreviousBudget}
					title='Previous Month'
				>
					<MoveLeft />
				</Button>
				<h1 className='text-3xl font-bold'>{dayjs(new Date(currentYear, currentMonth)).format('MMMM YYYY')}</h1>
				<Button
					onClick={getNextBudget}
					title='Next Month'
				>
					<MoveRight />
				</Button>
			</div>
			<h2 className='text-lg'>
				Income: $ <span className='text-accent font-bold'>{budget?.monthlyIncome ?? 'Loading...'}</span>
			</h2>
			<h2 className='text-lg'>
				Expenses: $ <span className='text-accent font-bold'>{budget?.monthlyExpenses ?? 'Loading...'}</span>
			</h2>
			<h2 className='text-lg'>
				Difference: $ <span className={budgetDifference >= 0 ? 'p-1 rounded-sm bg-success' : ' p-1 rounded-sm bg-destructive'}>{budgetDifference}</span>
			</h2>
			<div className='flex gap-4 pt-4'>
				<IncomeDialog />
				<ExpenseDialog />
				<BudgetDialog />
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
		</div>
	)
}

