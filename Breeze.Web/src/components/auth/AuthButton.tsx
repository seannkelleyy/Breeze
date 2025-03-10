import { useMsal } from '@azure/msal-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/button'
import { loginRequest } from '../../config/auth/MsalInstance'

export const AuthButton = () => {
	const { instance, accounts } = useMsal()
	const navigate = useNavigate()

	const handleLogin = () => {
		instance
			.loginPopup(loginRequest)
			.then((response) => {
				if (response.account) {
					navigate('/')
				}
			})
			.catch((error) => {
				console.error('Login failed', error)
			})
	}

	const handleLogout = () => {
		instance
			.logoutPopup()
			.then(() => {
				navigate('/login')
			})
			.catch((error) => {
				console.error('Logout failed', error)
			})
	}

	if (accounts.length > 0) {
		return <Button onClick={handleLogout}>Log out</Button>
	}

	return <Button onClick={handleLogin}>Log in</Button>
}

