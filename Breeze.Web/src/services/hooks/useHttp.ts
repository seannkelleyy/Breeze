import axios, { AxiosError } from 'axios'
import { useQuery } from 'react-query'
import { useEnvironmentVariables } from '../../config/environment/useEnvironmentVariables'
import { useMsal } from '@azure/msal-react'
import { InteractionRequiredAuthError } from '@azure/msal-browser'

const handleError = (error: AxiosError) => {
	if (error instanceof AxiosError) {
		throw error
	}
}

const useHttp = () => {
	const { instance } = useMsal()
	const { baseLocalApi, baseHostedApi, authApiId } = useEnvironmentVariables()

	const fetchToken = async () => {
		const account = instance.getAllAccounts()[0]
		if (!account) throw new Error('No account found')

		const tokenRequest = {
			scopes: [`${authApiId}/user.access`],
			account,
		}

		try {
			const response = await instance.acquireTokenSilent(tokenRequest)
			return response.accessToken
		} catch (error) {
			if (error instanceof InteractionRequiredAuthError) {
				const response = await instance.acquireTokenPopup(tokenRequest)
				return response.accessToken
			}
			throw error
		}
	}

	const {
		data: accessToken,
		refetch,
		isFetching,
	} = useQuery('accessToken', fetchToken, {
		enabled: false,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
		onSuccess: (token) => {
			if (token) {
				axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`
			}
		},
		onError: (error) => {
			console.error('Error fetching token:', error)
		},
	})

	const fetchAccessToken = async () => {
		try {
			await refetch()
		} catch (error) {
			console.error('Token fetch failed:', error)
		}
	}

	if (!accessToken && !isFetching) {
		fetchAccessToken()
	}

	const axiosInstance = axios.create({
		baseURL: process.env.NODE_ENV === 'production' ? baseHostedApi : baseLocalApi,
	})

	axiosInstance.interceptors.request.use(
		async (config) => {
			await checkForAccessToken()
			if (accessToken) {
				config.headers.Authorization = `Bearer ${accessToken}`
			}
			return config
		},
		(error) => {
			return Promise.reject(error)
		},
	)

	const checkForAccessToken = async () => {
		if (!accessToken) {
			await refetch()
		}
	}

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

	// Used for paging: Get headers alongside data
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

