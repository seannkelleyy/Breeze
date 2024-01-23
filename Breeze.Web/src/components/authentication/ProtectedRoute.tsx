import { useAuth0 } from '@auth0/auth0-react'
import { Outlet, Navigate } from 'react-router-dom'

const PrivateRoutes = () => {
	const auth = useAuth0()
	return auth.isAuthenticated ? <Outlet /> : <Navigate to='/login' />
}

export default PrivateRoutes
