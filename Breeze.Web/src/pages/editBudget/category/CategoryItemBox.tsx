import { BreezeButton } from '../../../components/shared/BreezeButton'
import { BreezeText } from '../../../components/shared/BreezeText'
import { CategoryItem } from './CategoryItem'
import { BreezeBox } from '../../../components/shared/BreezeBox'
import { useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useBudgetContext } from '../../../services/providers/BudgetProvider'
import { usePostCategory } from '@/services/hooks/category/usePostCategory'

type CategoryItemsBoxProps = {
	setExpenses: (amount: number) => void
}

/**
 * This component is a box that contains all the category items. It is displayed in the EditBudgetPage component.
 * @param setExpenses. A function to set the expenses after they have been changed.
 */
export const CategoryItemsBox = ({ setExpenses }: CategoryItemsBoxProps) => {
	const { user } = useAuth0()
	const { budget, categories, refetchCategories } = useBudgetContext()
	const postMutation = usePostCategory({
		category: {
			userId: user?.email ?? '',
			name: '',
			budgetId: budget.id,
			allocation: 0,
			currentSpend: 0,
		},
		onSettled: () => {
			refetchCategories()
		},
	})

	useEffect(() => {
		setExpenses(categories.reduce((acc, category) => acc + 1 * category.allocation, 0))
	}, [categories, setExpenses])

	return (
		<BreezeBox
			title='incomes'
			style={{
				padding: '0.5em',
				borderRadius: '0.5em',
				width: '100%',
			}}
		>
			<BreezeText
				type='small-heading'
				text='Categories'
			/>
			{categories.map((category) => (
				<CategoryItem
					key={category.id}
					categoryItem={category}
					refetchCategories={refetchCategories}
				/>
			))}
			<BreezeButton
				content='Add Category'
				onClick={() => postMutation.mutate()}
			/>
		</BreezeBox>
	)
}
