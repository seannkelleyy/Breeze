import { useAuth0 } from '@auth0/auth0-react'
import { BreezeButton } from '../shared/BreezeButton'

const LogoutButton = () => {
	const { logout } = useAuth0()

	return (
		<BreezeButton
			text='Log out'
			onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
		/>
	)
}

export default LogoutButton
