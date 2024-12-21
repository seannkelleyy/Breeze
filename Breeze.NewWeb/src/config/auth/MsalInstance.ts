import { PublicClientApplication } from '@azure/msal-browser'
import { useEnvironmentVariables } from '../environment/useEnvironmentVariables'

export const useMsalInstance = () => {
	const { authClientId, tenentAuthority, baseLocalUrl, baseHostedUrl } = useEnvironmentVariables()

	return new PublicClientApplication({
		auth: {
			clientId: authClientId,
			authority: 'https://login.microsoftonline.com/8ae2f3c6-fff1-4515-8822-26cdbe306321',
			redirectUri: process.env.NODE_ENV === 'production' ? baseHostedUrl : baseLocalUrl,
		},
		cache: {
			cacheLocation: 'sessionStorage',
			storeAuthStateInCookie: false,
		},
	})
}

export const loginRequest = {
	scopes: ['openid', 'profile', 'email', 'https://breezebudget.onmicrosoft.com/api/user.access'],
}

