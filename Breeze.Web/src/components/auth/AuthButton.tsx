import { useMsal } from '@azure/msal-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/button'
import { useEffect } from 'react'
import { loginRequest } from '../../config/auth/MsalInstance'

export const AuthButton = () => {
	const { instance, accounts } = useMsal()
	const navigate = useNavigate()

	useEffect(() => {
		const activeAccount = instance.getActiveAccount()
		if (activeAccount) {
			navigate('/')
		}
	}, [instance, navigate])

	const handleLogin = async () => {
		try {
			await instance.loginRedirect(loginRequest)
		} catch (error) {
			console.error('Login failed', error)
		}
	}

	const handleLogout = async () => {
		try {
			await instance.logoutRedirect()
			navigate('/login')
		} catch (error) {
			console.error('Logout failed', error)
		}
	}

	if (accounts.length > 0) {
		return <Button onClick={handleLogout}>Log out</Button>
	}

	return <Button onClick={handleLogin}>Log in</Button>
}

