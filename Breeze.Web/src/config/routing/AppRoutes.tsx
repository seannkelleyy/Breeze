import { BreezeBox } from '@/components/shared/BreezeBox'
import { BreezeText } from '@/components/shared/BreezeText'
import { HomePage } from '@/pages/homePage/HomePage'
import { LandingPage } from '@/pages/landing/LandingPage'
import { useAuth0 } from '@auth0/auth0-react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

export const AppRoutes = () => {
	const { isAuthenticated, isLoading } = useAuth0()

	if (isLoading) {
		return (
			<BreezeBox
				title='Loading'
				style={{
					width: '100%',
					height: '100%',
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
				}}
			>
				<BreezeText
					text='Loading...'
					type='small-heading'
				/>
			</BreezeBox>
		)
	}
	return (
		<BrowserRouter>
			<Routes>
				<Route
					path='/login'
					element={<LandingPage />}
				/>
				<Route
					path='/'
					element={isAuthenticated ? <HomePage /> : <Navigate to='/login' />}
				/>
			</Routes>
		</BrowserRouter>
	)
}
