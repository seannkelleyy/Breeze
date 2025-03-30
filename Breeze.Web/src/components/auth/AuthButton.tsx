import { useMsal, AuthenticatedTemplate, UnauthenticatedTemplate } from '@azure/msal-react'
import { Button } from '../ui/button'

// export const AuthButton = () => {
// 	const { instance, accounts } = useMsal()

// 	const handleLogin = async () => {
// 		try {
// 			await instance.loginPopup(loginRequest)
// 		} catch (error) {
// 			console.error('Login failed', error)
// 		}
// 	}

// 	const handleLogout = async () => {
// 		try {
// 			await instance.logoutRedirect()
// 		} catch (error) {
// 			console.error('Logout failed', error)
// 		}
// 	}

// 	if (accounts.length > 0) {
// 		return <Button onClick={handleLogout}>Log out</Button>
// 	}

// 	return <Button onClick={handleLogin}>Log in</Button>
// }

export const AuthButton = () => {
	const { instance, accounts } = useMsal()

	const isAuthenticated = accounts.length > 0 // Checks if a user is logged in

	const handleAuthAction = () => {
		if (isAuthenticated) {
			instance.logoutPopup().catch((e) => console.error(e)) // Log out
		} else {
			instance.loginPopup().catch((e) => console.error(e)) // Log in
		}
	}

	return <Button onClick={handleAuthAction}>{isAuthenticated ? 'Logout' : 'Login'}</Button>
}

