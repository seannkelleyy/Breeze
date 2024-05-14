import { useAuth0 } from '@auth0/auth0-react'
import axios from 'axios'
import { BASE_API_URL } from '../environment'

export const useAxiosWithAuth = () => {
	const { getAccessTokenSilently } = useAuth0()

	return axios.create({
		baseURL: BASE_API_URL,
		headers: {
			Authorization: `Bearer ${getAccessTokenSilently()}`,
		},
	})
}
