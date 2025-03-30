import { useMsal, AuthenticatedTemplate, UnauthenticatedTemplate } from '@azure/msal-react'
import { Button } from '../ui/button'
import { loginRequest } from '../../config/auth/msalConfig'

export const AuthButton = () => {
	const { instance } = useMsal()

	const handleLogin = () => {
		instance
			.loginPopup({
				...loginRequest,
				redirectUri: '/',
			})
			.catch((error) => console.log(error))
	}

	const handleLogout = () => {
		instance.logoutPopup({
			postLogoutRedirectUri: '/',
		})
		window.location.reload()
	}

	return (
		<>
			<AuthenticatedTemplate>
				<Button onClick={handleLogout}>Log out</Button>
			</AuthenticatedTemplate>

			<UnauthenticatedTemplate>
				<Button onClick={handleLogin}>Log in</Button>
			</UnauthenticatedTemplate>
		</>
	)
}

