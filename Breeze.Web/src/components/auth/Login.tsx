import { BreezeButton } from '../shared/BreezeButton'
import { Link } from 'react-router-dom'

/**
 * Simple login button from Auth0 docs.
 */
export const LoginButton = () => {
	//const { loginWithRedirect } = useAuth0()

	return (
		<Link to='/home'>
			<BreezeButton content='Log In/ Sign-Up' />
		</Link>
	)
}
