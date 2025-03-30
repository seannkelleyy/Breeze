// import { useMsal, AuthenticatedTemplate, UnauthenticatedTemplate } from '@azure/msal-react'
// import { Button } from '../ui/button'

// export const AuthButton = () => {
// 	const { instance } = useMsal()

// 	const handleLogin = () => {
// 		instance
// 			.loginPopup({
//  				redirectUri: '/',
// 			})
// 			.catch((error) => console.log(error))
// 	}

// 	const handleLogout = () => {
// 		instance.logoutPopup({
// 			postLogoutRedirectUri: '/',
// 		})
// 		window.location.reload()
// 	}

// 	return (
// 		<>
// 			<AuthenticatedTemplate>
// 				<Button onClick={handleLogout}>Log out</Button>
// 			</AuthenticatedTemplate>

// 			<UnauthenticatedTemplate>
// 				<Button onClick={handleLogin}>Log in</Button>
// 			</UnauthenticatedTemplate>
// 		</>
// 	)
// }

import { useMsal } from '@azure/msal-react'
import { Button } from '../ui/button'

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

	return <Button onClick={handleAuthAction}>{isAuthenticated ? 'Logout' : 'Login with Azure B2C'}</Button>
}

