import { BreezeButton } from '../shared/BreezeButton'
import { Navigate } from 'react-router-dom'

/**
 * Simple login button from Auth0 docs.
 */
export const LoginButton = () => {
	//const { loginWithRedirect } = useAuth0()

	return (
		<BreezeButton
			content='Log In/ Sign-Up'
			onClick={() => <Navigate to='/home' />}
		/>
	)
}
