import { AddButtons } from './AddButtons'
import { Goals } from './Goals'
import { Header } from './Header'
import { BudgetSection } from './budgetSection/BudgetSection'
import { Progress } from './Progress'
import './HomePage.css'
import { BreezeBox } from '../shared/BreezeBox'

/**
 * This is the home page component that calls the components that make up the home page.
 * This is where the user lands after signing in.
 */
export const HomePage = () => {
	return (
		<BreezeBox title='Home Page'>
			<section className='home-page'>
				<Header />
				<Progress />
				<Goals />
				<AddButtons />
			</section>
			<BreezeBox title='categories'>
				<BudgetSection />
			</BreezeBox>
		</BreezeBox>
	)
}
