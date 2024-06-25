export type EnvironmentVariables = {
    localApi: string
    hostedApi: string
    baseLocalUrl: string
    baseHostedUrl: string
    baseLocalLoginUrl: string
    baseHostedLoginUrl: string
    appVersion: string
    authClientId: string
    authDomain: string
    apiAudience: string
}
 
/**
 * This function returns the environment variables for the application.
 * @returns EnvironmentVariables
 */
export const useEnvironmentVariables = (): EnvironmentVariables => {
    const localApi =
        import.meta.env.VITE_LOCAL_API ?? 'https://localhost:7284';
 
    const hostedApi =
        import.meta.env.VITE_HOSTED_API ?? 'https://breeze-apiapp.azurewebsites.net';
    
    const baseLocalURL =
        import.meta.env.ENV_CONFIG?.VITE_BASE_LOCAL_URL ?? 'http://localhost:5173/';
    
    const baseHostedURL =
        import.meta.env.ENV_CONFIG?.VITE_BASE_HOSTED_URL ?? 'https://breezebudgeting.azurewebsites.net/';
    
    const baseLocalLoginURL =
        import.meta.env.ENV_CONFIG?.VITE_BASE_LOCAL_LOGIN_URL ?? 'http://localhost:5173/login';
    
    const baseHostedLoginURL =
        import.meta.env.ENV_CONFIG?.VITE_BASE_HOSTED_LOGIN_URL ?? 'https://breezebudgeting.azurewebsites.net/login';
    
    const appVersion =
        import.meta.env.ENV_CONFIG?.VITE_APP_VERSION ?? '1.0.0';
    
    const authClientId =
        import.meta.env.ENV_CONFIG?.VITE_AUTH_CLIENT_ID ?? 'Osw8qGrmXjQe3kYYcL0ca3FdUqB9LeVd';
    
    const authDomain =
        import.meta.env.ENV_CONFIG?.VITE_AUTH_DOMAIN ?? 'dev-r15wsyccxyjfwrqm.us.auth0.com';
    
    const apiAudience = import.meta.env.VITE_API_AUDIENCE ?? 'breeze-apiapp.azurewebsites.net/';
 
    const EnvironmentVars: EnvironmentVariables = {
        localApi: localApi,
        hostedApi: hostedApi,
        baseLocalUrl: baseLocalURL,
        baseHostedUrl: baseHostedURL,
        baseLocalLoginUrl: baseLocalLoginURL,
        baseHostedLoginUrl: baseHostedLoginURL,
        appVersion: appVersion,
        authClientId: authClientId,
        authDomain: authDomain,
        apiAudience: apiAudience
    }
 
    return EnvironmentVars;
}
