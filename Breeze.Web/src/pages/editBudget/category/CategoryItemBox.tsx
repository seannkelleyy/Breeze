import { BreezeButton } from '../../../components/shared/BreezeButton'
import { BreezeText } from '../../../components/shared/BreezeText'
import { CategoryItem } from './CategoryItem'
import { BreezeBox } from '../../../components/shared/BreezeBox'
import { useEffect } from 'react'
import { Category, useCategories } from '../../../services/hooks/CategoryServices'
import { useAuth0 } from '@auth0/auth0-react'
import { useBudgetContext } from '../../../services/providers/BudgetProvider'
import { useMutation } from 'react-query'

type CategoryItemsBoxProps = {
	setExpenses: (amount: number) => void
}

export const CategoryItemsBox = ({ setExpenses }: CategoryItemsBoxProps) => {
	const { postCategory } = useCategories()
	const { budget, categories, refetchCategories } = useBudgetContext()
	const postMutation = useMutation(postCategory, {
		onSettled: () => {
			refetchCategories()
		},
	})
	const { user } = useAuth0()

	useEffect(() => {
		setExpenses(categories.reduce((acc, category) => acc + 1 * category.allocation, 0))
	}, [categories, setExpenses])

	const addCategory = () => {
		const newCategory: Category = {
			userId: user?.email ?? '',
			name: '',
			budgetId: budget.id,
			allocation: 0,
			currentSpend: 0,
		}
		postMutation.mutate(newCategory)
	}

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
				onClick={addCategory}
			/>
		</BreezeBox>
	)
}
