import { useMsal } from '@azure/msal-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/button'
import { loginRequest } from '../../config/auth/MsalInstance'

export const AuthButton = () => {
	const { instance, accounts } = useMsal()
	const navigate = useNavigate()

	if (accounts.length > 0) {
		return (
			<Button
				onClick={() => {
					instance
						.logoutPopup()
						.then(() => {
							navigate('/')
						})
						.catch((error) => {
							console.error('Logout failed', error)
						})
				}}
			>
				Log out
			</Button>
		)
	}

	return (
		<Button
			onClick={() => {
				instance
					.loginPopup(loginRequest)
					.then((response) => {
						if (response && response.account) {
							console.log('Login successful', response.account)
							navigate('/')
						}
					})
					.catch((error) => {
						console.error('Login failed', error)
					})
			}}
		>
			Log in
		</Button>
	)
}

