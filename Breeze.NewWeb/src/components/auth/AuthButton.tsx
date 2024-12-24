import { useMsal } from '@azure/msal-react'
import { Button } from '../ui/button'
import { loginRequest } from '../../config/auth/MsalInstance'

export const AuthButton = () => {
	const { instance, accounts } = useMsal()

	if (accounts.length > 0) {
		return <Button onClick={() => instance.logoutPopup()}>Log out</Button>
	}
	return <Button onClick={() => instance.loginPopup(loginRequest)}>Log in</Button>
}

