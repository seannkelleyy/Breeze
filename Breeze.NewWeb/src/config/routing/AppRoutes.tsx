import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { LandingPage } from '../../pages/LandingPage'
import { BudgetProvider } from '../../services/providers/BudgetProvider'
import { useMsal } from '@azure/msal-react'

export const AppRoutes = () => {
	const { accounts } = useMsal()
	const isAuthenticated = accounts.length > 0

	return (
		<BrowserRouter>
			<Routes>
				<Route
					path='/'
					element={
						isAuthenticated ? (
							<BudgetProvider>
								<h1>Hello</h1>
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

