import { PublicClientApplication } from '@azure/msal-browser'
import { useEnvironmentVariables } from '../environment/useEnvironmentVariables'

export const useMsalInstance = () => {
	const { authClientId, authTenantId } = useEnvironmentVariables()

	return new PublicClientApplication({
		auth: {
			clientId: authClientId,
			authority: `https://login.microsoftonline.com/${authTenantId}`,
			redirectUri: window.location.origin,
		},
		cache: {
			cacheLocation: 'sessionStorage',
			storeAuthStateInCookie: false,
		},
	})
}

export const loginRequest = {
	scopes: ['openid', 'offline_access', 'https://breezebudget.onmicrosoft.com/api/user.access'],
}

