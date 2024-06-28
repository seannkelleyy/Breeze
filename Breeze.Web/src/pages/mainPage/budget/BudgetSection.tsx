import { useEffect, useState } from 'react'
import { BreezeButton } from '../../../components/shared/BreezeButton'
import { useBudgetContext } from '../../../services/providers/BudgetProvider'
import { BreezeCard } from '../../../components/shared/BreezeCard'
import { BreezeBox } from '../../../components/shared/BreezeBox'
import { BreezeText } from '../../../components/shared/BreezeText'
import { Budget } from '@/services/hooks/budget/budgetServices'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import dayjs, { Dayjs } from 'dayjs'
import { LoadingEffect } from '@/components/shared/LoadingEffect'
import { EditBudgetModal } from '../modals/editBudgetModal/EditBudgetModal'
import { CategoryOverview } from './CategoryOverview'

/**
 * This is the category section view of that home page that gives a brief
 * overview of the current budget.
 */
export const BudgetSection = () => {
	const [budgetDate, setBudgetDate] = useState<Dayjs>(dayjs())
	const { budget, totalSpent, categories, getBudgetForDate, refetchCategories } = useBudgetContext()
	const [response, setResponse] = useState<{ status: number; budget?: Budget; error?: string }>()
	const [showEditBudgetModal, setShowEditBudgetModal] = useState(false)

	useEffect(() => {
		const fetchBudget = async () => {
			try {
				const response = await getBudgetForDate(budgetDate.year(), budgetDate.month())
				setResponse(response)
			} catch (error) {
				console.error('An error occurred while fetching the budget:', error)
			}
		}

		fetchBudget()
		refetchCategories()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [budgetDate])

	const changeBudgetDate = (direction: boolean) => {
		if (direction) {
			setBudgetDate(budgetDate.add(1, 'month'))
		} else {
			setBudgetDate(budgetDate.subtract(1, 'month'))
		}
	}

	if (budget.id === undefined) return <LoadingEffect />

	if ((response?.status ?? 0) > 300)
		return (
			<BreezeText
				type='large'
				text='No budget found'
				style={{
					width: '80%',
					textAlign: 'center',
				}}
			/>
		)

	return (
		<BreezeBox title='budget'>
			<BreezeBox
				title='budget-date'
				direction='row'
			>
				<BreezeButton
					content={<ArrowLeft />}
					onClick={() => changeBudgetDate(false)}
				/>
				<BreezeText
					type='large'
					style={{
						textAlign: 'center',
						background: 'var(--color-card-background)',
						boxShadow: 'var(--shadow-box-shadow)',
						borderRadius: '0.75rem',
						padding: '.5em 1em',
					}}
					text={budgetDate.format('MMM YYYY')}
				/>
				<BreezeButton
					content={<ArrowRight />}
					onClick={() => changeBudgetDate(true)}
				/>
			</BreezeBox>
			<BreezeButton
				content='Edit Budget'
				onClick={() => setShowEditBudgetModal(true)}
			/>
			{showEditBudgetModal && (
				<EditBudgetModal
					date={budgetDate}
					setShowModal={setShowEditBudgetModal}
				/>
			)}

			<BreezeCard title='Glance'>
				<BreezeText
					type='small-heading'
					text='This month at a glance'
				/>
				<BreezeText
					type='large'
					text={`Total income: $${budget.monthlyIncome ?? 0}`}
				/>
				<BreezeText
					type='large'
					text={`Total spent: $${totalSpent ?? 0}`}
				/>
				<BreezeText
					type='large'
					text={`Remaining: $${(budget.monthlyIncome ?? 0) - (totalSpent ?? 0)}`}
				/>
			</BreezeCard>
			<BreezeBox
				title='Categories'
				style={{
					width: '100%',
				}}
			>
				{categories &&
					categories.map((category, index) => (
						<CategoryOverview
							key={index}
							category={category}
						/>
					))}
			</BreezeBox>
		</BreezeBox>
	)
}
