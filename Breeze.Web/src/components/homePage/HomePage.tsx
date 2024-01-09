import AddButtons from './AddButtons'
import Goals from './Goals'
import Header from './Header'
import BudgetSection from './budgetSection/BudgetSection'
import Progress from './Progress'
import './HomePage.css'

/**
 * This is the home page component that calls the components that make up the home page
 *
 */
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
