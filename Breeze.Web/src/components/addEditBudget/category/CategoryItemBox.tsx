import { Category, emptyCategory } from '../../../models/category'
import { BreezeButton } from '../../shared/BreezeButton'
import { BreezeText } from '../../shared/BreezeText'
import { CategoryItem } from './CategoryItem'
import { BreezeBox } from '../../shared/BreezeBox'
import { useEffect, useState } from 'react'

type CategoryItemsBoxProps = {
	categoryItems: Category[]
}

export const CategoryItemsBox = (props: CategoryItemsBoxProps) => {
	const { categoryItems } = props
	const [items, setItems] = useState<Category[]>(categoryItems)

	useEffect(() => {
		setItems(categoryItems)
	}, [categoryItems])

	const addCategory = () => {
		setItems([...items, emptyCategory])
	}

	return (
		<BreezeBox
			title='incomes'
			style={{
				border: 'var(--border) solid 2px',
				padding: '0.5em',
				borderRadius: '0.5em',
				width: '100%',
			}}
		>
			<BreezeText
				type='small-heading'
				text='Categories'
			/>
			{items.map((Category) => (
				<CategoryItem
					key={Category.id}
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
