import { Link } from 'react-router-dom'
import { Category } from '../../../models/category'
import { BreezeButton } from '../../shared/BreezeButton'
import { BreezeText } from '../../shared/BreezeText'
import { CategoryItem } from './CategoryItem'
import { BreezeBox } from '../../shared/BreezeBox'

type CategoryItemsBoxProps = {
	CategoryItems: Category[]
}

export const CategoryItemsBox = (props: CategoryItemsBoxProps) => {
	const { CategoryItems } = props

	const addCategory = () => {
		console.log('add category')
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
			{CategoryItems.map((Category) => (
				<CategoryItem
					key={Category.id}
					categoryItem={Category}
				/>
			))}
			<Link to={'/Breeze/Budget/CreateCategory'}>
				<BreezeButton
					text='Add Category'
					onClick={addCategory}
				/>
			</Link>
		</BreezeBox>
	)
}
