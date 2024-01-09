import { Goal } from '../../models/goal'
import { goals } from '../../services/data/goals'
import './homePage.css'

const Goals = () => {
	return (
		<section className='item-container'>
			<h2>Goals</h2>
			<ul>
				{goals.map((goal: Goal) => (
					<li key={goal.id}>{goal.goal}</li>
				))}
			</ul>
		</section>
	)
}

export default Goals
