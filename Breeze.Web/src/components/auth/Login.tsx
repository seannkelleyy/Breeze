import { useAuth0 } from '@auth0/auth0-react'
import { BreezeButton } from '../shared/BreezeButton'

/**
 * Simple login button from Auth0 docs.
 */
export const LoginButton = () => {
	const { loginWithRedirect } = useAuth0()

	return (
		<BreezeButton
			content='Log In/ Sign-Up'
			onClick={() => loginWithRedirect()}
		/>
	)
}
