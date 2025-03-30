import { useMsal, AuthenticatedTemplate, UnauthenticatedTemplate } from '@azure/msal-react'
import { Button } from '../ui/button'
import { loginRequest } from '../../config/auth/authConfig'
import useDeviceDetection from '../../config/device/useDeviceDetection'

export const AuthButton = () => {
	const { instance } = useMsal()
	const device = useDeviceDetection()
	const isMobile = device === 'Mobile' || device === 'Tablet'

	console.log('Device:', device)
	console.log('isMobile:', isMobile)

	const handleLogin = () => {
		if (isMobile) {
			instance.loginRedirect({
				...loginRequest,
				redirectUri: '/',
			})
			return
		}
		instance
			.loginPopup({
				...loginRequest,
				redirectUri: '/',
			})
			.catch((error) => console.log(error))
	}

	const handleLogout = () => {
		if (isMobile) {
			instance.logoutRedirect({
				postLogoutRedirectUri: '/login',
			})
			return
		}
		instance.logoutPopup({
			postLogoutRedirectUri: '/login',
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

