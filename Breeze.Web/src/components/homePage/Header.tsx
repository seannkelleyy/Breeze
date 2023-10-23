import './homePage.css'
import { getMonthAsString } from '../../utils/GetMonth'
const Header = () => {
	const today = new Date()

	return (
		<>
			<h1 className='title'>
				<u>BREEZE</u>
			</h1>
			<section className='item-container'>
				<h2>
					{today.getDate() + ' '}
					{getMonthAsString(today.getMonth()) + ' '}
					{today.getFullYear()}
				</h2>
			</section>
		</>
	)
}

export default Header
