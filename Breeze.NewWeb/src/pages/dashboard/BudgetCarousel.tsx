import { useBudgetContext } from '../../services/providers/BudgetProvider'
import { Card } from '../../components/ui/card'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '../../components/ui/carousel'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { ExpensesTable } from './DataTables.tsx/CategoryDataTable'
import { IncomeTable } from './DataTables.tsx/IncomeDataTable'
import { IncomeModal } from './modals/IncomeModal'
import { ExpenseModal } from './modals/ExpenseModal'
import { CreateBudget } from '../budget/CreateBudget'

export const BudgetCarousel = () => {
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

	const budgetDifference = parseFloat((budget?.monthlyIncome - budget?.monthlyExpenses).toFixed(2)) ?? 3903.36

	return (
		<div className='absolute top-1/4 left-1/2 transform -translate-x-1/2 w-1/2'>
			<Carousel>
				<CarouselContent className='flex flex-col'>
					<CarouselItem className='flex flex-col'>
						<Card className='flex flex-col justify-start items-center p-4'>
							<h1 className='text-2xl font-bold'>{budget?.date ?? 'December 2024'}</h1>
							<h2>
								Income: $ <span className='text-accent'>{budget?.monthlyIncome?.toFixed(2) ?? 5672.23}</span>
							</h2>
							<h2>
								Expenses: $ <span className='text-accent'>{budget?.monthlyExpenses?.toFixed(2) ?? 1768.87}</span>
							</h2>
							<h2>
								Difference: $ <span className={budgetDifference > 0 ? 'p-1 rounded-sm bg-success' : ' p-1 rounded-sm bg-destructive'}>{budgetDifference}</span>
							</h2>
							<div className='flex gap-4 pt-4'>
								<IncomeModal />
								<ExpenseModal />
							</div>
							<CreateBudget />
							<Tabs
								defaultValue='expenses'
								className='flex flex-col justify-center items-center mt-4'
							>
								<TabsList className=''>
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
		</div>
	)
}

