import { LandingPage } from '@/pages/landing/LandingPage'
import { BudgetProvider } from '@/services/providers/BudgetProvider'
import { useAuth0 } from '@auth0/auth0-react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Loading } from './Loading'
import { HomePage } from '@/pages/mainPage/overview/HomePage'

export const AppRoutes = () => {
	const { isAuthenticated, isLoading } = useAuth0()

	if (isLoading) return <Loading />

	return (
		<BrowserRouter>
			<Routes>
				<Route
					path='/'
					element={
						isAuthenticated ? (
							<BudgetProvider>
								<HomePage />
							</BudgetProvider>
						) : (
							<Navigate to='/login' />
						)
					}
				/>
				<Route
					path='/login'
					element={<LandingPage />}
				/>
				<Route
					path='*'
					element={isAuthenticated ? <Navigate to='/' /> : <Navigate to='/login' />}
				/>
			</Routes>
		</BrowserRouter>
	)
}
