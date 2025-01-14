import { useState } from 'react'
import { useBudgetContext } from '../../services/providers/BudgetProvider'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '../ui/carousel'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { ExpensesTable } from './CategoryDataTable'
import { IncomeTable } from './IncomeDataTable'
import { IncomeModal } from './modals/IncomeModal'
import { ExpenseModal } from './modals/ExpenseModal'

export const BudgetCarousel = () => {
	const [incomeOpen, setIncomeOpen] = useState<boolean>(false)
	const [expenseOpen, setExpenseOpen] = useState<boolean>(false)
	const { budget, totalSpent, categories, getBudgetForDate, refetchCategories } = useBudgetContext()
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

	//const budgetDifference = (budget?.monthlyIncome - budget?.monthlyExpenses).toFixed(2)
	const budgetDifference = 3903.36

	return (
		<Carousel className='mt-4 min-w-1/2'>
			<CarouselContent>
				<CarouselItem>
					<Card className='flex flex-col justify-center items-center p-4'>
						<h1 className='text-xl font-bold'>{budget?.date ?? 'December 2024'}</h1>
						<h2>
							Income: $ <span className='text-accent'>{budget?.monthlyIncome?.toFixed(2) ?? 5672.23}</span>
						</h2>
						<h2>
							Expenses: $ <span className='text-accent'>{budget?.monthlyExpenses?.toFixed(2) ?? 1768.87}</span>
						</h2>
						<h2>
							Difference: $ <span className={budgetDifference > 0 ? 'p-1 rounded-sm bg-success' : ' p-1 rounded-sm bg-destructive'}>{budgetDifference}</span>
						</h2>
						<div className='flex gap-4 mt-4'>
							<Button onClick={() => setIncomeOpen(true)}>Add Income</Button>
							<Button onClick={() => setExpenseOpen(true)}>Add Expense</Button>
						</div>
						<IncomeModal
							open={incomeOpen}
							onClose={() => setIncomeOpen(false)}
						/>
						<ExpenseModal
							open={expenseOpen}
							onClose={() => setExpenseOpen(false)}
						/>
						<Tabs
							defaultValue='expenses'
							className='flex flex-col justify-center items-center mt-4'
						>
							<TabsList className='w-fit'>
								<TabsTrigger value='income'>Income</TabsTrigger>
								<TabsTrigger value='expenses'>Expenses</TabsTrigger>
							</TabsList>
							<TabsContent value='income'>
								<IncomeTable />
							</TabsContent>
							<TabsContent value='expenses'>
								<ExpensesTable />
							</TabsContent>
						</Tabs>
					</Card>
				</CarouselItem>
			</CarouselContent>
			<CarouselPrevious onClick={getPreviousBudget} />
			<CarouselNext onClick={getNextBudget} />
		</Carousel>
	)
}

