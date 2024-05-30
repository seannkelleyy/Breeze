import { BreezeButton } from '../../../components/shared/BreezeButton'
import { BreezeText } from '../../../components/shared/BreezeText'
import { CategoryItem } from './CategoryItem'
import { BreezeBox } from '../../../components/shared/BreezeBox'
import { useEffect, useState } from 'react'
import { Category, EmptyCategory } from '../../../services/hooks/CategoryServices'

type CategoryItemsBoxProps = {
	categoryItems: Category[]
}
export const CategoryItemsBox = ({ categoryItems }: CategoryItemsBoxProps) => {
	const [items, setItems] = useState<Category[]>(categoryItems)

	useEffect(() => {
		setItems(categoryItems)
	}, [categoryItems])

	const addCategory = () => {
		setItems([...items, EmptyCategory])
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
