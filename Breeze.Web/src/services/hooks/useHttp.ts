import axios, { AxiosError } from 'axios'

const handleError = (error: AxiosError) => {
	if (error instanceof AxiosError) {
		throw error
	}
}

const useHttp = () => {
	// const fetchToken = async () => {
	// 	const account = instance.getAllAccounts()[0]
	// 	if (!account) throw new Error('No account found')

	// 	const tokenRequest = {
	// 		scopes: [import.meta.env.VITE_AUTH_API_SCOPE],
	// 		account,
	// 	}

	// 	try {
	// 		const response = await instance.acquireTokenSilent(tokenRequest)
	// 		return response.accessToken
	// 	} catch (error) {
	// 		if (error instanceof InteractionRequiredAuthError) {
	// 			const response = await instance.acquireTokenPopup(tokenRequest)
	// 			return response.accessToken
	// 		}
	// 		throw error
	// 	}
	// }

	// const {
	// 	data: accessToken,
	// 	refetch,
	// 	isFetching,
	// } = useQuery('accessToken', fetchToken, {
	// 	enabled: false,
	// 	refetchInterval: 1000 * 60 * 3,
	// 	retry: true,
	// 	retryDelay: 1000 * 5,
	// 	onSuccess: (token) => {
	// 		if (token) {
	// 			axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`
	// 		}
	// 	},
	// })

	// const fetchAccessToken = async () => {
	// 	try {
	// 		await refetch()
	// 	} catch (error) {
	// 		console.error('Token fetch failed:', error)
	// 	}
	// }

	// if (!accessToken && !isFetching) {
	// 	fetchAccessToken()
	// }

	const axiosInstance = axios.create({
		baseURL: process.env.NODE_ENV === 'production' ? import.meta.env.VITE_BASE_HOSTED_API : import.meta.env.VITE_BASE_LOCAL_API,
	})

	// axiosInstance.interceptors.request.use(
	// 	async (config) => {
	// 		await checkForAccessToken()
	// 		if (accessToken) {
	// 			config.headers.Authorization = `Bearer ${accessToken}`
	// 		}
	// 		return config
	// 	},
	// 	(error) => {
	// 		return Promise.reject(error)
	// 	},
	// )

	// const checkForAccessToken = async () => {
	// 	if (!accessToken) {
	// 		await refetch()
	// 	}
	// }

	const getOne = async <T>(relativeUri: string): Promise<T> => {
		try {
			//await checkForAccessToken()
			return (await axiosInstance.get<T>(relativeUri)).data as T
		} catch (error) {
			handleError(error as AxiosError)
		}
		return undefined as unknown as T
	}

	const getMany = async <T>(relativeUri: string): Promise<T[]> => {
		try {
			//await checkForAccessToken()
			return (await axiosInstance.get<T[]>(relativeUri)).data
		} catch (error) {
			handleError(error as AxiosError)
		}
		return [] as T[]
	}

	const getManyArray = async <T>(relativeUri: string): Promise<T[][]> => {
		try {
			//await checkForAccessToken()
			return (await axiosInstance.get<T[][]>(relativeUri)).data
		} catch (error) {
			handleError(error as AxiosError)
		}
		return [[]] as T[][]
	}

	// Used for paging: Get headers alongside data
	const getManyHeader = async <T>(relativeUri: string): Promise<{ data: T[]; headers: unknown }> => {
		try {
			//await checkForAccessToken()
			const response = await axiosInstance.get<T[]>(relativeUri)
			return { data: response.data, headers: response.headers }
		} catch (error) {
			handleError(error as AxiosError)
		}
		return { data: [] as T[], headers: {} }
	}

	const post = async <T, S>(relativeUri: string, rq: S): Promise<T> => {
		try {
			//await checkForAccessToken()
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
			//await checkForAccessToken()
			return (await axiosInstance.patch<T>(relativeUri, rq)).data
		} catch (error) {
			handleError(error as AxiosError)
		}
		return {} as T
	}

	const put = async <T, S>(relativeUri: string, rq: S): Promise<T> => {
		try {
			//await checkForAccessToken()
			return (await axiosInstance.put<T>(relativeUri, rq)).data
		} catch (error) {
			handleError(error as AxiosError)
		}
		return {} as T
	}

	const deleteOne = async <T>(relativeUri: string): Promise<void> => {
		try {
			//await checkForAccessToken()
			await axiosInstance.delete<T>(relativeUri)
		} catch (error) {
			handleError(error as AxiosError)
		}
	}

	return { getOne, getMany, getManyArray, getManyHeader, post, patch, put, deleteOne }
}

export default useHttp

