import { Goal } from '../../../models/goal'
import { goals } from '../../../services/data/goals'
import { BreezeCard } from '../../shared/BreezeCard'
import { BreezeList } from '../../shared/BreezeList'
import { BreezeText } from '../../shared/BreezeText'
import './homePage.css'

/**
 * This is a future component that will display the user's goals.
 */
export const Goals = () => {
	return (
		<BreezeCard title='Goals'>
			<BreezeText
				text='Goals'
				type='small-heading'
			/>
			<BreezeList>
				{goals.map((goal: Goal) => (
					<li key={goal.id}>{goal.goal}</li>
				))}
			</BreezeList>
		</BreezeCard>
	)
}
