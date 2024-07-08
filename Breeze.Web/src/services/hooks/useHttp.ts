import { useEnvironmentVariables } from '@/config/environment/useEnvironmentVariables'
import { useAuth0 } from '@auth0/auth0-react'
import axios, { AxiosError } from 'axios'
import { useQuery } from 'react-query'
 
const handleError = (error: AxiosError) => {
    if (error instanceof AxiosError) {
        throw error
    }
}
 
const useHttp =  () => {
    const { getAccessTokenSilently } = useAuth0();
    const {baseLocalApi, baseHostedApi, apiAudience} = useEnvironmentVariables()

    
    const fetchToken = async () => {
        return await getAccessTokenSilently({
            authorizationParams: {
                scope: 'read:data write:data',
                audience: apiAudience
            }
        })
    }
    
    const { data: accessToken, refetch } = useQuery('accessToken', fetchToken, {
        refetchInterval: 1000 * 180,
        refetchOnWindowFocus: true,
        refetchOnMount: true,
        refetchOnReconnect: true,
        onSuccess: (accessToken) => {
            if (accessToken) {
                axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
            }
        }
    })

    const checkForAccessToken = async () => {
        if (!accessToken) {
            await refetch();
        }
    }
    
    const axiosInstance = axios.create({
        baseURL: process.env.NODE_ENV === 'production' ? baseHostedApi : baseLocalApi, 
    })

    axiosInstance.interceptors.request.use(
        async (config) => {
            await checkForAccessToken()
            if (accessToken) {
                config.headers.Authorization = `Bearer ${accessToken}`;
            }
            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    )


    const getOne = async <T>(relativeUri: string): Promise<T> => {
        try {
            await checkForAccessToken()
            return (await axiosInstance.get<T>(relativeUri)).data as T
        } catch (error) {
            handleError(error as AxiosError)
        }
        return undefined as unknown as T
    }
 
    const getMany = async <T>(relativeUri: string): Promise<T[]> => {
        try {
            await checkForAccessToken()
            return (await axiosInstance.get<T[]>(relativeUri)).data
        } catch (error) {
            handleError(error as AxiosError)
        }
        return [] as T[]
    }

    const getManyArray = async <T>(relativeUri: string): Promise<T[][]> => {
        try {
            await checkForAccessToken()
            return (await axiosInstance.get<T[][]>(relativeUri)).data
        } catch (error) {
            handleError(error as AxiosError)
        }
        return [[]] as T[][]
    }
 
    // use getManyHeader to get the headers of the response.  Used for paging
    const getManyHeader = async <T>(relativeUri: string): Promise<{ data: T[]; headers: unknown }> => {
        try {
            await checkForAccessToken()
            const response = await axiosInstance.get<T[]>(relativeUri)
            return { data: response.data, headers: response.headers }
        } catch (error) {
            handleError(error as AxiosError)
        }
        return { data: [] as T[], headers: {} }
    }
 
    const post = async <T, S>(relativeUri: string, rq: S): Promise<T> => {
        try {
            await checkForAccessToken()
            return (await axiosInstance.post<T>(relativeUri, rq)).data as T
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw error
            }
            throw new Error('An unexpected error occurred')
        }
    }
 
    const patch = async <T, S>(relativeUri: string, rq: S): Promise<T> => {
        try {
            await checkForAccessToken()
            return (await axiosInstance.patch<T>(relativeUri, rq)).data
        } catch (error) {
            handleError(error as AxiosError)
        }
        return {} as T
    }
 
    const put = async <T, S>(relativeUri: string, rq: S): Promise<T> => {
        try {
            await checkForAccessToken()
            return (await axiosInstance.put<T>(relativeUri, rq)).data
        } catch (error) {
            handleError(error as AxiosError)
        }
        return {} as T
    }

    const deleteOne = async <T>(relativeUri: string): Promise<void> => {
        try {
            await checkForAccessToken()
            await axiosInstance.delete<T>(relativeUri)
        } catch (error) {
            handleError(error as AxiosError)
        }
    }
 
    return { getOne, getMany, getManyArray, getManyHeader, post, patch, put, deleteOne }
}
 
export default useHttp
 