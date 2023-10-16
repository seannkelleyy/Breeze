import { Category } from '../../models/category'

type categoryItemProps = {
	category: Category
}
const CategoryItem = (props: categoryItemProps) => {
	return (
		<div className='category-item'>
			<div className='category-item-name'>{props.category.name}</div>
			<div className='category-item-amount'>{props.category.budget}</div>
			<div className='category-item-amount'>{props.category.curentSpend}</div>
		</div>
	)
}

export default CategoryItem
