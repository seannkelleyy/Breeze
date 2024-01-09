import './homePage.css'
import { getMonthAsString } from '../../services/utils/GetMonth'
import { BreezeText } from '../shared/BreezeText'
import { BreezeCard } from '../shared/BreezeCard'

/**
 * The header of the home page. Shows title and date.
 */
export const Header = () => {
	const today = new Date()

	return (
		<>
			<BreezeText
				text={<u>BREEZE</u>}
				type='title'
			/>
			<BreezeCard title='Date'>
				<BreezeText
					text={`${today.getDate() + ' '}
					${getMonthAsString(today.getMonth()) + ' '}
					${today.getFullYear()}`}
					type='small-heading'
				/>
			</BreezeCard>
		</>
	)
}
