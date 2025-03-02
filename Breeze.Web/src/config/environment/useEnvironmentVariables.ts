export type EnvironmentVariables = {
	baseLocalApi: string
	baseHostedApi: string
	baseLocalUrl: string
	baseHostedUrl: string
	baseLocalLoginUrl: string
	baseHostedLoginUrl: string
	appVersion: string
	authClientId: string
	authTenantId: string
	authApiId: string
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
	AUTH_TENANT_ID: string
	AUTH_API_ID: string
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
	const authClientId = getValue('VITE_AUTH_CLIENT_ID', '6b9d2142-9242-4d76-b20f-c2e99f8424f8')
	const authTenantId = getValue('VITE_AUTH_TENANT_ID', '8ae2f3c6-fff1-4515-8822-26cdbe306321')
	const authApiId = getValue('VITE_API_AUTHORITY', 'https://breezebudget.onmicrosoft.com/api')

	const EnvironmentVars: EnvironmentVariables = {
		baseLocalApi,
		baseHostedApi,
		baseLocalUrl,
		baseHostedUrl,
		baseLocalLoginUrl,
		baseHostedLoginUrl,
		appVersion,
		authClientId,
		authTenantId,
		authApiId,
	}

	return EnvironmentVars
}

