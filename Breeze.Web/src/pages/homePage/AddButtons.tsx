import { Link } from 'react-router-dom'
import { BreezeBox } from '../../components/shared/BreezeBox'
import { BreezeButton } from '../../components/shared/BreezeButton'

/**
 * Simple component that holds the add expense and add income buttons
 */
export const AddButtons = () => {
	return (
		<BreezeBox title='Add Buttons'>
			<Link to='/add-expense'>
				<BreezeButton
					onClick={() => console.log('Add New Expense')}
					content='Add New Expense'
					size='large'
				/>
			</Link>
			<Link to='/add-income'>
				<BreezeButton
					onClick={() => console.log('Add New Income')}
					content='Add New Income'
					size='large'
				/>
			</Link>
		</BreezeBox>
	)
}