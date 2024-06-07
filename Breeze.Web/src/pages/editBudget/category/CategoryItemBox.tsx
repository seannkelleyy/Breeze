import { BreezeButton } from '../../../components/shared/BreezeButton'
import { BreezeText } from '../../../components/shared/BreezeText'
import { CategoryItem } from './CategoryItem'
import { BreezeBox } from '../../../components/shared/BreezeBox'
import { useEffect, useState } from 'react'
import { Category, useCategories } from '../../../services/hooks/CategoryServices'
import { useAuth0 } from '@auth0/auth0-react'
import { useBudgetContext } from '../../../services/providers/BudgetProvider'
import { useMutation } from 'react-query'

type CategoryItemsBoxProps = {
	categoryItems: Category[]
	setExpenses: (amount: number) => void
}

export const CategoryItemsBox = ({ categoryItems, setExpenses }: CategoryItemsBoxProps) => {
	const { postCategory } = useCategories()
	const postMutation = useMutation(postCategory, {
		onSuccess: (id, variables) => {
			variables.id = id
			setItems((prevItems) => [...prevItems, variables])
		},
	})
	const { user } = useAuth0()
	const { budget } = useBudgetContext()
	const [items, setItems] = useState<Category[]>(categoryItems ?? [])

	useEffect(() => {
		setExpenses(items.reduce((acc, item) => acc + 1 * item.allocation, 0))
	}, [items, setExpenses])

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

	const onUpdate = (category: Category) => {
		const newItems = items.map((item) => {
			if (item.id === category.id) {
				return category
			}
			return item
		})
		setItems(newItems)
	}

	const handleDelete = (deletedCategory: Category) => {
		setItems(items.filter((category) => category.id !== deletedCategory.id))
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
			{items &&
				items.map((category) => (
					<CategoryItem
						key={category.id}
						categoryItem={category}
						onUpdate={onUpdate}
						onDelete={handleDelete}
					/>
				))}
			<BreezeButton
				content='Add Category'
				onClick={addCategory}
			/>
		</BreezeBox>
	)
}
