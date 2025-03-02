export type EnvironmentVariables = {
	baseLocalApi: string
	baseHostedApi: string
	baseLocalUrl: string
	baseHostedUrl: string
	baseLocalLoginUrl: string
	baseHostedLoginUrl: string
	appVersion: string
	authClientId: string
	authDomain: string
	apiAudience: string
}

export type ENV_CONFIG = {
	BASE_LOCAL_API: string
	BASE_HOSTED_API: string
	BASE_LOCAL_URL: string
	BASE_HOSTED_URL: string
	BASE_LOCAL_LOGIN_URL: string
	BASE_HOSTED_LOGIN_URL: string
	APP_VERSION: string
	AUTH_CLIENT_ID: string
	AUTH_DOMAIN: string
	API_AUDIENCE: string
	[key: string]: string
}

export type ExtendedWindow = Window &
	typeof globalThis & {
		ENV_CONFIG: ENV_CONFIG
	}

/**
 * This function returns the environment variables for the application.
 * @returns EnvironmentVariables
 */
export const useEnvironmentVariables = (): EnvironmentVariables => {
	const windowConfig = (window as ExtendedWindow).ENV_CONFIG

	const getValue = (envVar: string, defaultValue: string) => ((windowConfig[envVar] ?? `%${envVar}%`) === `%${envVar}%` ? defaultValue : windowConfig[envVar])

	const baseLocalApi = getValue('BASE_LOCAL_API', 'https://localhost:7284')
	const baseHostedApi = getValue('BASE_HOSTED_API', 'https://breeze-api.azurewebsites.net')
	const baseLocalUrl = getValue('BASE_LOCAL_URL', 'http://localhost:5173/')
	const baseHostedUrl = getValue('BASE_HOSTED_URL', 'https://www.breeze.seannkelleyy/')
	const baseLocalLoginUrl = getValue('BASE_LOCAL_LOGIN_URL', 'http://localhost:5173/login')
	const baseHostedLoginUrl = getValue('BASE_HOSTED_LOGIN_URL', 'https://www.breeze.seannkelleyy.com/login')
	const appVersion = getValue('APP_VERSION', '1.0.0')
	const authClientId = getValue('VITE_AUTH_CLIENT_ID', 'Osw8qGrmXjQe3kYYcL0ca3FdUqB9LeVd')
	const authDomain = getValue('VITE_AUTH_DOMAIN', 'dev-r15wsyccxyjfwrqm.us.auth0.com')
	const apiAudience = getValue('VITE_API_AUDIENCE', 'breeze-api.azurewebsites.net')

	const EnvironmentVars: EnvironmentVariables = {
		baseLocalApi,
		baseHostedApi,
		baseLocalUrl,
		baseHostedUrl,
		baseLocalLoginUrl,
		baseHostedLoginUrl,
		appVersion,
		authClientId,
		authDomain,
		apiAudience,
	}

	return EnvironmentVars
}

