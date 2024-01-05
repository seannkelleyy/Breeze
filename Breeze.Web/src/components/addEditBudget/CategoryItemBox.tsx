import { Link } from 'react-router-dom'
import { Category } from '../../models/category'
import { BreezeButton } from '../shared/BreezeButton'
import { BreezeText } from '../shared/BreezeText'
import { CategoryItem } from './CategoryItem'
import './addEditBudget.css'

type CategoryItemsBoxProps = {
	CategoryItems: Category[]
}

export const CategoryItemsBox = (props: CategoryItemsBoxProps) => {
	const { CategoryItems } = props

	const addCategory = () => {
		console.log('add category')
	}
	return (
		<section
			title='categories'
			className='item-box'
		>
			<BreezeText text='Categories' />
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
		</section>
	)
}
