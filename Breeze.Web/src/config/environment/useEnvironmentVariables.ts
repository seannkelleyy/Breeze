export type EnvironmentVariables = {
    localApi: string
    hostedApi: string
    baseUrl: string
    appVersion: string
    authClientId: string
    authDomain: string
}
 
export const useEnvironmentVariables = (): EnvironmentVariables => {
    const localApi =
        import.meta.env.VITE_LOCAL_API ?? 'https://localhost:7284';
 
    const hostedApi =
        import.meta.env.VITE_HOSTED_API ?? 'https://breeze-apiapp.azurewebsites.net';
    
    const baseUrl =
        import.meta.env.ENV_CONFIG?.VITE_BASE_URL ?? 'http://localhost:5173/home';
    
    const appVersion =
        import.meta.env.ENV_CONFIG?.VITE_APP_VERSION ?? '1.0.0';
    
    const authClientId =
        import.meta.env.ENV_CONFIG?.VITE_AUTH_CLIENT_ID ?? 'Osw8qGrmXjQe3kYYcL0ca3FdUqB9LeVd';
    
    const authDomain =
        import.meta.env.ENV_CONFIG?.VITE_AUTH_DOMAIN ?? 'dev-r15wsyccxyjfwrqm.us.auth0.com';
 
    const EnvironmentVars: EnvironmentVariables = {
        localApi: localApi,
        hostedApi: hostedApi,
        baseUrl: baseUrl,
        appVersion: appVersion,
        authClientId: authClientId,
        authDomain: authDomain
    }
 
    return EnvironmentVars;
}
