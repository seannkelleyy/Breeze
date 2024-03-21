import { BreezeBox } from '../shared/BreezeBox'
import { BreezeInput } from '../shared/BreezeInput'

export const AddIncome = () => {
	return (
		<BreezeBox title='Add-Income'>
			<h1>Add Income</h1>
			<BreezeInput
				type='string'
				title='Income Name'
				placeholder='name'
			/>
			<BreezeInput
				type='number'
				title='Income Ammount'
				placeholder='amount'
			/>
			<BreezeInput
				type='Income Date'
				title='Income Date'
				placeholder='date'
			/>
		</BreezeBox>
	)
}
