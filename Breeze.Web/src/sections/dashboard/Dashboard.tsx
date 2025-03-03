import { useBudgetContext } from '../../services/providers/BudgetProvider'
import { Card } from '../../components/ui/card'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '../../components/ui/carousel'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { IncomeDialog } from './dialogs/IncomeDialog'
import { ExpenseDialog } from './dialogs/ExpenseDialog'
import { CreateBudgetDialog } from '../budget/CreateBudgetDialog'
import { Goals } from '../goals/Goals'
import { IncomeTable } from './dataTables/IncomeTable'
import { ExpensesTable } from './dataTables/ExpenseTable'
import dayjs from 'dayjs'
import { EditBudgetDialog } from '../budget/EditBudgetDialog'

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
		<Carousel className='absolute left-1/2 transform -translate-x-1/2 overflow-x-hidden'>
			<CarouselContent>
				<CarouselItem>
					<Card className='flex flex-col gap-1 justify-start items-center p-4'>
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
							<IncomeDialog />
							<ExpenseDialog />
							{budget ? <EditBudgetDialog /> : <CreateBudgetDialog />}
						</div>
						<Goals />
						<Tabs
							defaultValue='expenses'
							className='flex flex-col justify-center items-center mt-4'
						>
							<TabsList>
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

