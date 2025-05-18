import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { LandingPage } from '../../sections/LandingPage'
import { BudgetProvider } from '../../services/providers/BudgetProvider'
import { Navigation } from '../../components/navigation/Navigation'
import { Dashboard } from '../../sections/dashboard/Dashboard'
import { SignedIn, useUser } from '@clerk/clerk-react'

export const AppRoutes = () => {
	const isAuthenticated = useUser().isSignedIn

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
						<SignedIn>
							<BudgetProvider>
								<div className='h-screen w-screen flex flex-col justify-center items-center'>
									<Navigation />
									<Dashboard />
								</div>
							</BudgetProvider>
						</SignedIn>
					}
				/>
			</Routes>
		</BrowserRouter>
	)
}

