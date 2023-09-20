import LoginButton from '../auth0/Login'
import './LandingPage.css'

const LandingPage = () => {
	return (
		<div>
			<h1 className='title'>
				<u>BREEZE</u>
			</h1>
			<LoginButton />
		</div>
	)
}

export default LandingPage
