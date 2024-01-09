import LoginButton from '../auth0/Login'
import { BreezeBox } from '../shared/BreezeBox'
import { BreezeText } from '../shared/BreezeText'

/**
 * This is the page that the user is taken to when they first visit the site.
 * They are prompted to login and then taken to the home page.
 */
export const LandingPage = () => {
	return (
		<BreezeBox title='LandingPage'>
			<BreezeText
				text={<u>BREEZE</u>}
				type='title'
			/>
			<LoginButton />
		</BreezeBox>
	)
}
