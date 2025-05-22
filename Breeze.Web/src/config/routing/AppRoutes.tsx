import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { LandingPage } from '../../sections/LandingPage'
import { BudgetDataProvider } from '../../services/providers/BudgetProvider'
import { Navigation } from '../../components/navigation/Navigation'
import { Dashboard } from '../../sections/dashboard/Dashboard'
import { useAuth, useUser } from '@clerk/clerk-react'
import { ReactNode } from 'react'
import { Button } from '../../components/ui/button'

const NotFound = () => {
	const navigate = useNavigate()

	//TODO: Make Urls global variables or environment variables
	const homeUrl = useAuth().isSignedIn ? '/' : '/login'

	return (
		<div className='h-screen w-screen flex flex-col justify-center items-center'>
			<Navigation />
			<h1 className='text-3xl font-bold mb-4'>404 - Page Not Found</h1>
			<Button onClick={() => navigate(homeUrl)}>Go to Home</Button>
		</div>
	)
}

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
	const { isSignedIn, isLoaded } = useUser()

	// TODO: Add proper loading state handling
	if (!isLoaded) return <div>Loading...</div>
	if (!isSignedIn) return <Navigate to='/login' />

	return children
}

export const AppRoutes = () => {
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
						<ProtectedRoute>
							<BudgetDataProvider>
								<div className='h-screen w-screen flex flex-col justify-center items-center'>
									<Navigation />
									<Dashboard />
								</div>
							</BudgetDataProvider>
						</ProtectedRoute>
					}
				/>
				<Route
					path='*'
					element={<NotFound />}
				/>
			</Routes>
		</BrowserRouter>
	)
}

