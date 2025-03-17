import { useMsal } from '@azure/msal-react'
import { Button } from '../ui/button'
import { loginRequest } from '../../config/auth/MsalInstance'

export const AuthButton = () => {
	const { instance, accounts } = useMsal()

	const handleLogin = async () => {
		try {
			await instance.loginPopup(loginRequest)
		} catch (error) {
			console.error('Login failed', error)
		}
	}

	const handleLogout = async () => {
		try {
			await instance.logoutRedirect()
		} catch (error) {
			console.error('Logout failed', error)
		}
	}

	if (accounts.length > 0) {
		return <Button onClick={handleLogout}>Log out</Button>
	}

	return <Button onClick={handleLogin}>Log in</Button>
}

