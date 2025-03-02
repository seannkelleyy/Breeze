import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { LandingPage } from '../../sections/LandingPage'
import { BudgetProvider } from '../../services/providers/BudgetProvider'
import { useMsal } from '@azure/msal-react'
import { Navigation } from '../../components/navigation/Navigation'
import { BudgetCarousel } from '../../sections/dashboard/BudgetCarousel'

export const AppRoutes = () => {
	const { accounts, inProgress } = useMsal()

	const isAuthenticated = accounts.length > 0

	if (inProgress === 'login' || inProgress === 'logout') {
		return <div>Loading...</div>
	}

	return (
		<BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
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

