import { useAuth0 } from '@auth0/auth0-react'
import { BreezeButton } from '../shared/BreezeButton'
import { Navigate } from 'react-router-dom'

/**
 * Simple login button from Auth0 docs.
 */
const LoginButton = () => {
	//const { loginWithRedirect } = useAuth0()

	return (
		<BreezeButton
			content='Log In/ Sign-Up'
			onClick={() => <Navigate to='/home' />}
		/>
	)
}

export default LoginButton
