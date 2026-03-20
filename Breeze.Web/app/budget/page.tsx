'use client'
import { useEffect, useState } from 'react'

import dayjs from 'dayjs'
import { MoveLeft, MoveRight, RefreshCw } from 'lucide-react'

import { useBudgetContext } from './providers/index'
import { useRegenerateBudget } from './hooks/budget/index'
import { Button } from '@/components/ui/button'
import { BudgetDialog, CreateExpenseDialog, CreateIncomeDialog, ExpensesTable, Goals, IncomeTable, RecurringTemplatesDialog } from './components/index'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { isMoneyGreaterThanOrEqualWithTolerance } from '../planner/lib/constants'

/**
 * Main page of the application displaying a budget and goals.
 * @returns {JSX.Element} The Dashboard component displaying budget overview and management options.
 */
const Dashboard = () => {
	const { budget, getBudgetForDate, refetchBudget, refetchIncomes, refetchCategories } = useBudgetContext()
	const { regenerateBudgetMonth } = useRegenerateBudget()
	const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
	const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
	const [confirmRegenerate, setConfirmRegenerate] = useState(false)
	const [regenerating, setRegenerating] = useState(false)
	const [regenerateMessage, setRegenerateMessage] = useState('')

	useEffect(() => {
		getBudgetForDate(currentYear, currentMonth)
		setRegenerateMessage('')
		setConfirmRegenerate(false)
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
	const isBudgetDifferencePositive = isMoneyGreaterThanOrEqualWithTolerance(budgetDifference, 0)

	const handleRegenerate = async () => {
		setRegenerating(true)
		setRegenerateMessage('')
		try {
			await regenerateBudgetMonth(currentYear, currentMonth + 1)
			await Promise.all([refetchBudget(), refetchIncomes(), refetchCategories()])
			setRegenerateMessage(`Recurring templates regenerated for ${dayjs(new Date(currentYear, currentMonth)).format('MMMM YYYY')}.`)
		} catch {
			setRegenerateMessage('Failed to regenerate recurring templates. Please try again.')
		} finally {
			setRegenerating(false)
			setConfirmRegenerate(false)
		}
	}

	return (
		<div className='text-center pt-[10vh] max-w-xl py-4 rounded-[.5rem] overflow-x-hidden flex flex-col gap-1 justify-start items-center m-auto'>
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
				Difference: $ <span className={isBudgetDifferencePositive ? 'p-1 rounded-sm bg-success' : ' p-1 rounded-sm bg-destructive'}>{budgetDifference}</span>
			</h2>
			<div className='flex gap-4 pt-4 flex-wrap justify-center items-center'>
				<CreateIncomeDialog />
				<CreateExpenseDialog />
				<RecurringTemplatesDialog />
				<BudgetDialog />
			</div>
			{confirmRegenerate ? (
				<div className='w-full rounded-lg border border-orange-300 bg-orange-50 dark:bg-orange-950/30 dark:border-orange-700 px-4 py-3 text-sm flex flex-col sm:flex-row items-center gap-3'>
					<span className='text-orange-800 dark:text-orange-300 flex-1'>
						This will delete and re-generate all template-sourced rows for <strong>{dayjs(new Date(currentYear, currentMonth)).format('MMMM YYYY')}</strong>. Continue?
					</span>
					<div className='flex gap-2'>
						<Button
							size='sm'
							variant='destructive'
							disabled={regenerating}
							onClick={() => void handleRegenerate()}
						>
							{regenerating ? 'Regenerating...' : 'Confirm'}
						</Button>
						<Button
							size='sm'
							variant='outline'
							disabled={regenerating}
							onClick={() => setConfirmRegenerate(false)}
						>
							Cancel
						</Button>
					</div>
				</div>
			) : (
				<Button
					variant='ghost'
					size='sm'
					className='text-muted-foreground gap-1'
					onClick={() => setConfirmRegenerate(true)}
				>
					<RefreshCw className='w-3.5 h-3.5' />
					Regenerate Month
				</Button>
			)}
			{regenerateMessage ? (
				<div
					className={`w-full rounded-md border px-3 py-2 text-sm ${regenerateMessage.startsWith('Failed') ? 'border-destructive/30 bg-destructive/10 text-destructive' : 'border-green-300 bg-green-50 dark:bg-green-950/30 dark:border-green-700 text-green-800 dark:text-green-300'}`}
				>
					{regenerateMessage}
				</div>
			) : null}
			<Goals />
			<Tabs
				defaultValue='expenses'
				className='flex flex-col justify-center items-center m-4'
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

export default Dashboard

