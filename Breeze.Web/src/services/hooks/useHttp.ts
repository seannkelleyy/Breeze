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
    const {localApi, hostedApi, apiAudience} = useEnvironmentVariables()
    const apiUrl = process.env.NODE_ENV === 'production' ? hostedApi : localApi  

    const fetchToken = async () => {
        const token = await getAccessTokenSilently({
            authorizationParams: {
                scope: 'read:data write:data',
                audience: apiAudience
            }
        });
        if (!token) {
            throw new Error('Token is undefined');
        }
        return token;
    };
    const { data: accessToken, refetch } = useQuery('accessToken', fetchToken, {
        refetchInterval: 1000 * 180,
        refetchOnWindowFocus: true,
        refetchOnMount: true,
        refetchOnReconnect: true,
        refetchIntervalInBackground: true,
        onSettled: () => {
            if (accessToken) {
                axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
            }
        }
    });

    const getOne = async <T>(relativeUri: string): Promise<T> => {
        try {
            if (!accessToken || accessToken === undefined) {
                await refetch()
            }
            const response = await axios.get<T>(`${apiUrl}/${relativeUri}`)
            return response.data as T
        } catch (error) {
            handleError(error as AxiosError)
        }
        return undefined as unknown as T
    }
 
    const getMany = async <T>(relativeUri: string): Promise<T[]> => {
        try {
            if (!accessToken || accessToken === undefined) {
                await refetch()
            }
            const response = await axios.get<T[]>(`${apiUrl}/${relativeUri}`)
            return response.data
        } catch (error) {
            handleError(error as AxiosError)
        }
        return [] as T[]
    }

    const getManyArray = async <T>(relativeUri: string): Promise<T[][]> => {
        try {
            if (!accessToken || accessToken === undefined) {
                await refetch()
            }
            const response = await axios.get<T[][]>(`${apiUrl}/${relativeUri}`)
            return response.data
        } catch (error) {
            handleError(error as AxiosError)
        }
        return [[]] as T[][]
    }
 
    // use getManyHeader to get the headers of the response.  Used for paging
    const getManyHeader = async <T>(relativeUri: string): Promise<{ data: T[]; headers: unknown }> => {
        try {
            if (!accessToken || accessToken === undefined) {
                await refetch()
            }
            const response = await axios.get<T[]>(`${apiUrl}/${relativeUri}`)
            return { data: response.data, headers: response.headers }
        } catch (error) {
            handleError(error as AxiosError)
        }
        return { data: [] as T[], headers: {} }
    }
 
    const post = async <T, S>(relativeUri: string, rq: S): Promise<T> => {
        try {
            if (!accessToken || accessToken === undefined) {
                await refetch()
            }
            const response = await axios.post<T>(`${apiUrl}/${relativeUri}`, rq)
            return response.data as T
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw error
            }
            throw new Error('An unexpected error occurred')
        }
    }
 
    const patch = async <T, S>(relativeUri: string, rq: S): Promise<T> => {
        try {
            if (!accessToken || accessToken === undefined) {
                await refetch()
            }
            const response = await axios.patch<T>(`${apiUrl}/${relativeUri}`, rq)
            return response.data
        } catch (error) {
            handleError(error as AxiosError)
        }
        return {} as T
    }
 
    const put = async <T, S>(relativeUri: string, rq: S): Promise<T> => {
        try {
            if (!accessToken || accessToken === undefined) {
                await refetch()
            }
            const response = await axios.put<T>(`${apiUrl}/${relativeUri}`, rq)
            return response.data
        } catch (error) {
            handleError(error as AxiosError)
        }
        return {} as T
    }

    const deleteOne = async <T>(relativeUri: string): Promise<void> => {
        try {
            if (!accessToken || accessToken === undefined) {
                await refetch()
            }
            await axios.delete<T>(`${apiUrl}/${relativeUri}`)
        } catch (error) {
            handleError(error as AxiosError)
        }
    }
 
    return { getOne, getMany, getManyArray, getManyHeader, post, patch, put, deleteOne }
}
 
export default useHttp
 