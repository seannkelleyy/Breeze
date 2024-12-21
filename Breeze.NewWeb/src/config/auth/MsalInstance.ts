import { PublicClientApplication } from '@azure/msal-browser'
import { useEnvironmentVariables } from '../environment/useEnvironmentVariables'

export const useMsalInstance = () => {
	const { authClientId, authTenantId, baseLocalUrl, baseHostedUrl } = useEnvironmentVariables()

	return new PublicClientApplication({
		auth: {
			clientId: authClientId,
			authority: `https://login.microsoftonline.com/${authTenantId}`,
			redirectUri: process.env.NODE_ENV === 'production' ? baseHostedUrl : baseLocalUrl,
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

