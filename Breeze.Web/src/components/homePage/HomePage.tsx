import AddButtons from './AddButtons'
import Goals from './Goals'
import Header from './Header'
import BudgetSection from './budget/BudgetSection'
import Progress from './Progress'
import './HomePage.css'

const HomePage = () => {
	return (
		<div className='page'>
			<div className='home-page'>
				<Header />
				<Progress />
				<Goals />
				<AddButtons />
			</div>
			<div className='budget-section'>
				<BudgetSection />
			</div>
		</div>
	)
}

export default HomePage
