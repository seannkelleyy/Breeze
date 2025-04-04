export const msalConfig = {
	auth: {
		clientId: import.meta.env.VITE_AUTH_CLIENT_ID,
		authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AUTH_TENANT_ID}`,
		redirectUri: process.env.NODE_ENV === 'production' ? import.meta.env.VITE_BASE_HOSTED_URI : import.meta.env.VITE_BASE_LOCAL_URI,
	},
	cache: {
		cacheLocation: 'localStorage',
		storeAuthStateInCookie: false,
	},
}

export const loginRequest = {
	scopes: ['openid', 'offline_access', import.meta.env.VITE_AUTH_API_SCOPE],
}

