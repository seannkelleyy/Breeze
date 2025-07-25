import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { BudgetDataProvider } from '../../services/providers/BudgetProvider'
import { useAuth, useUser } from '@clerk/clerk-react'
import { ReactNode } from 'react'
import { Button } from '../../components/ui/button'
import { LandingPage } from '../../components/landingPage/LandingPage'
import { Dashboard } from '../../components/dashboard/Dashboard'
import { Navigation } from '../../components/navigation'

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

