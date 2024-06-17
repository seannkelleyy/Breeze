import { useEnvironmentVariables } from '@/config/environment/useEnvironmentVariables'
import axios, { AxiosError } from 'axios'
 
const handleError = (error: AxiosError) => {
    if (error instanceof AxiosError) {
        throw error
    }
}
 
const useHttp =  () => {
    //const { getAccessTokenSilently } = useAuth0();
    //const [accessToken, setAccessToken] = useState<string>(null as unknown as string)
    const apiUrl = useEnvironmentVariables().hostedApi


    // const fetchToken = async () => {
    //     const token = await getAccessTokenSilently();
    //     if (token)
    //         console.log('Token fetched: ' + token);
    //     setAccessToken(token);
    // };

    // useEffect(() => {
    //     fetchToken().catch((error) => {
    //         console.error(error);
    //     });
    //     if (accessToken) {
    //         axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    //         console.log('Access token set' + accessToken);
    //     }
    // // eslint-disable-next-line react-hooks/exhaustive-deps
    // }, [getAccessTokenSilently]);

    const getOne = async <T>(relativeUri: string): Promise<T> => {
        try {
            const response = await axios.get<T>(`${apiUrl}/${relativeUri}`, {
                // headers: {
                //     Authorization: `Bearer ${accessToken}`,
                // },
            })
            return response.data as T
        } catch (error) {
            handleError(error as AxiosError)
        }
        return undefined as unknown as T
    }
 
    const getMany = async <T>(relativeUri: string): Promise<T[]> => {
        try {
            const response = await axios.get<T[]>(`${apiUrl}/${relativeUri}`, {
                // headers: {
                //     Authorization: `Bearer ${accessToken}`,
                // },
            })
            return response.data
        } catch (error) {
            handleError(error as AxiosError)
        }
        return [] as T[]
    }

    const getManyArray = async <T>(relativeUri: string): Promise<T[][]> => {
        try {
            const response = await axios.get<T[][]>(`${apiUrl}/${relativeUri}`, {
                // headers: {
                //     Authorization: `Bearer ${accessToken}`,
                // },
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
            const response = await axios.get<T[]>(`${apiUrl}/${relativeUri}`, {
                // headers: {
                //     Authorization: `Bearer ${accessToken}`,
                // },
            })
            return { data: response.data, headers: response.headers }
        } catch (error) {
            handleError(error as AxiosError)
        }
        return { data: [] as T[], headers: {} }
    }
 
    const post = async <T, S>(relativeUri: string, rq: S): Promise<T> => {
        try {
            const response = await axios.post<T>(`${apiUrl}/${relativeUri}`, rq, {
                // headers: {
                //     Authorization: `Bearer ${accessToken}`,
                // },
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
            const response = await axios.patch<T>(`${apiUrl}/${relativeUri}`, rq, {
                // headers: {
                //     Authorization: `Bearer ${accessToken}`,
                // },
            })
            return response.data
        } catch (error) {
            handleError(error as AxiosError)
        }
        return {} as T
    }
 
    const put = async <T, S>(relativeUri: string, rq: S): Promise<T> => {
        try {
            const response = await axios.put<T>(`${apiUrl}/${relativeUri}`, rq, {
                // headers: {
                //     Authorization: `Bearer ${accessToken}`,
                // },
            })
            return response.data
        } catch (error) {
            handleError(error as AxiosError)
        }
        return {} as T
    }
 
    const deleteOne = async <T>(relativeUri: string): Promise<void> => {
        try {
            await axios.delete<T>(`${apiUrl}/${relativeUri}`, {
                // headers: {
                //     Authorization: `Bearer ${accessToken}`,
                // },
            })
        } catch (error) {
            handleError(error as AxiosError)
        }
    }
 
    return { getOne, getMany, getManyArray, getManyHeader, post, patch, put, deleteOne }
}
 
export default useHttp
 