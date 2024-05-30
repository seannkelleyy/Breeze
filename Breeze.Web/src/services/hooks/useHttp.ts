import axios, { AxiosError } from 'axios'
import { useEffect, useState } from 'react'
import { useEnvironmentVariables } from '../../config/environment/useEnvironmentVariables'
import { useAuth0 } from '@auth0/auth0-react'
 
const handleError = (error: AxiosError) => {
    if (error instanceof AxiosError) {
        throw error
    }
}
 
const useHttp =  () => {
    const { getAccessTokenSilently } = useAuth0();
    const [accessToken, setAccessToken] = useState<string>(null as unknown as string)
    const {hostedApi} = useEnvironmentVariables()

    const fetchToken = async () => {
        const token = await getAccessTokenSilently();
        setAccessToken(token);
    };

    useEffect(() => {
        fetchToken().catch((error) => {
            console.error(error);
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getAccessTokenSilently]);

    const getOne = async <T>(relativeUri: string): Promise<T> => {
        try {
            await fetchToken()
            const response = await axios.get<T>(`${hostedApi}/${relativeUri}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            })
            return response.data as T
        } catch (error) {
            handleError(error as AxiosError)
        }
        return undefined as unknown as T
    }
 
    const getMany = async <T>(relativeUri: string): Promise<T[]> => {
        try {
            await fetchToken()
            const response = await axios.get<T[]>(`${hostedApi}/${relativeUri}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            })
            return response.data
        } catch (error) {
            handleError(error as AxiosError)
        }
        return [] as T[]
    }

    const getManyArray = async <T>(relativeUri: string): Promise<T[][]> => {
        try {
            await fetchToken()
            const response = await axios.get<T[][]>(`${hostedApi}/${relativeUri}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            })
            return response.data
        } catch (error) {
            handleError(error as AxiosError)
        }
        return [[]] as T[][]
    }
 
    // use getManyHeader to get the headers of the response.  Used for paging
    const getManyHeader = async <T>(relativeUri: string): Promise<{ data: T[]; headers: unknown }> => {
        try {
            await fetchToken()
            const response = await axios.get<T[]>(`${hostedApi}/${relativeUri}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            })
            return { data: response.data, headers: response.headers }
        } catch (error) {
            handleError(error as AxiosError)
        }
        return { data: [] as T[], headers: {} }
    }
 
    const post = async <T, S>(relativeUri: string, rq: S): Promise<T> => {
        try {
            await fetchToken()
            const response = await axios.post<T>(`${hostedApi}/${relativeUri}`, rq, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            })
            return response.data as T
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw error
            }
            throw new Error('An unexpected error occurred')
        }
        return {} as T
    }
 
    const patch = async <T, S>(relativeUri: string, rq: S): Promise<T> => {
        try {
            await fetchToken()
            const response = await axios.patch<T>(`${hostedApi}/${relativeUri}`, rq, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            })
            return response.data
        } catch (error) {
            handleError(error as AxiosError)
        }
        return {} as T
    }
 
    const put = async <T, S>(relativeUri: string, rq: S): Promise<T> => {
        try {
            await fetchToken()
            const response = await axios.put<T>(`${hostedApi}/${relativeUri}`, rq, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            })
            return response.data
        } catch (error) {
            handleError(error as AxiosError)
        }
        return {} as T
    }
 
    const deleteOne = async <T>(relativeUri: string): Promise<void> => {
        try {
            await fetchToken()
            await axios.delete<T>(`${hostedApi}/${relativeUri}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            })
        } catch (error) {
            handleError(error as AxiosError)
        }
    }
 
    return { getOne, getMany, getManyArray, getManyHeader, post, patch, put, deleteOne }
}
 
export default useHttp
 