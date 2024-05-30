import { Route } from 'react-router-dom'
import { LandingPage } from '../../pages/landing/LandingPage'

type ProtectedRouteProps = {
	path: string
	element: JSX.Element
}

export const ProtectedRoute = ({ path, element }: ProtectedRouteProps) => {
	const isAuthenticated = false
	return isAuthenticated ? (
		<Route
			path={path}
			element={element}
		/>
	) : (
		<Route
			path='/login'
			element={<LandingPage />}
		/>
	)
}
