import { useBudgetContext } from '../../services/providers/BudgetProvider'
import { Card } from '../ui/card'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '../ui/carousel'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { ExpensesTable } from './CategoryDataTable'
import { IncomeTable } from './IncomeDataTable'

export const BudgetCarousel = () => {
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

	return (
		<Carousel>
			<CarouselContent>
				<CarouselItem>
					<Card className='flex flex-col justify-center items-center p-4'>
						<h1 className='text-xl font-bold'>{budget?.date ?? 'December 2024'}</h1>
						<h2>
							Income: $ <span className='text-accent'>{budget?.monthlyIncome?.toFixed(2) ?? 0.0}</span>
						</h2>
						<h2>
							Expenses: $ <span className='text-accent'>{budget?.monthlyExpenses?.toFixed(2) ?? 0.0}</span>
						</h2>
						<Tabs
							defaultValue='expenses'
							className='w-[400px]'
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

