import { useAuth0 } from '@auth0/auth0-react'
import { BreezeButton } from '../shared/BreezeButton'
import { useEnvironmentVariables } from '@/config/environment/useEnvironmentVariables'

/**
 * Simple logout button from Auth0 docs.
 */
const LogoutButton = () => {
	const { logout } = useAuth0()
	const { baseLocalLoginUrl, baseHostedLoginUrl } = useEnvironmentVariables()
	const loginUrl = process.env.NODE_ENV === 'production' ? baseHostedLoginUrl : baseLocalLoginUrl

	return (
		<BreezeButton
			content='Log out'
			style={{
				padding: '0.5em',
			}}
			onClick={() => logout({ logoutParams: { returnTo: loginUrl } })}
		/>
	)
}

export default LogoutButton
