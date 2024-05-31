import { BreezeButton } from '../../../components/shared/BreezeButton'
import { BreezeText } from '../../../components/shared/BreezeText'
import { CategoryItem } from './CategoryItem'
import { BreezeBox } from '../../../components/shared/BreezeBox'
import { useEffect, useState } from 'react'
import { Category } from '../../../services/hooks/CategoryServices'
import { useAuth0 } from '@auth0/auth0-react'
import { useBudgetContext } from '../../../services/contexts/BudgetContext'

type CategoryItemsBoxProps = {
	categoryItems: Category[]
}
export const CategoryItemsBox = ({ categoryItems }: CategoryItemsBoxProps) => {
	const { user } = useAuth0()
	const { budget } = useBudgetContext()
	const [items, setItems] = useState<Category[]>(categoryItems)

	useEffect(() => {
		setItems(categoryItems)
	}, [categoryItems])

	const addCategory = () => {
		const newCategory: Category = {
			userEmail: user?.email ?? '',
			name: '',
			budgetId: budget.id,
			allocation: 0,
			currentSpend: 0,
			expenses: [],
		}
		setItems([...items, newCategory])
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
			{items.map((Category, index) => (
				<CategoryItem
					key={index}
					categoryItem={Category}
				/>
			))}
			<BreezeButton
				text='Add Category'
				onClick={addCategory}
			/>
		</BreezeBox>
	)
}
