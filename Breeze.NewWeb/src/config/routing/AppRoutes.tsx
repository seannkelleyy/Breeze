import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { LandingPage } from '../../pages/LandingPage'
import { BudgetProvider } from '../../services/providers/BudgetProvider'
import { useMsal } from '@azure/msal-react'
import { Navigation } from '../../components/navigation/Navigation'
import { BudgetCarousel } from '../../pages/dashboard/BudgetCarousel'

export const AppRoutes = () => {
	const { accounts } = useMsal()
	const isAuthenticated = accounts.length > 0

	return (
		<BrowserRouter>
			<Routes>
				<Route
					path='/login'
					element={
						<>
							<Navigation />
							<LandingPage />
						</>
					}
				/>
				<Route
					path='/'
					element={
						isAuthenticated ? (
							<BudgetProvider>
								<div className='h-screen w-screen flex flex-col justify-center items-center'>
									<Navigation />
									<BudgetCarousel />
								</div>
							</BudgetProvider>
						) : (
							<Navigate to='/login' />
						)
					}
				/>
				<Route
					path='*'
					element={isAuthenticated ? <Navigate to='/' /> : <Navigate to='/login' />}
				/>
			</Routes>
		</BrowserRouter>
	)
}

