import { AddButtons } from './AddButtons'
import { Goals } from './features/Goals'
import { BudgetSection } from './budgetSection/BudgetSection'
import { Progress } from './features/Progress'
import { BreezeBox } from '../shared/BreezeBox'
import { BreezeText } from '../../components/shared/BreezeText'
import { BreezeCard } from '../../components/shared/BreezeCard'
import { getMonthAsString } from '../../services/utils/GetMonth'

/**
 * This is the home page component that calls the components that make up the home page.
 * This is where the user lands after signing in.
 */
export const HomePage = () => {
	const today = new Date()

	return (
		<BreezeBox title='Home Page'>
			<BreezeBox
				title='Overview'
				style={{
					height: '100vh',
					overflowY: 'hidden',
					textAlign: 'center',
				}}
			>
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
				<Progress />
				<Goals />
				<AddButtons />
			</BreezeBox>
			<BreezeBox title='categories'>
				<BudgetSection />
			</BreezeBox>
		</BreezeBox>
	)
}
