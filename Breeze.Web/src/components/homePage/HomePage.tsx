import AddButtons from './AddButtons'
import Goals from './Goals'
import Header from './Header'
import './HomePage.css'
import Progress from './Progress'

const HomePage = () => {
	return (
		<div className='home-page'>
			<Header />
			<Progress />
			<Goals />
			<AddButtons />
		</div>
	)
}

export default HomePage
