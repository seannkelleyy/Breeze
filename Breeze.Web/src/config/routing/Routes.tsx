import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import { LandingPage } from '../../pages/landing/LandingPage'
import { HomePage } from '../../pages/homePage/HomePage'
import { EditBudgetPage } from '../../pages/editBudget/EditBudget'
import { Profile } from '../../components/auth/Profile'
import { AddIncome } from '../../pages/addItems/AddIncome'
import { AddExpense } from '../../pages/addItems/AddExpense'
import { useAuth0 } from '@auth0/auth0-react'
import { BreezeBox } from '@/components/shared/BreezeBox'
import { BreezeText } from '@/components/shared/BreezeText'

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
				<Route
					path='/budget/:year/:month'
					element={isAuthenticated ? <EditBudgetPage /> : <Navigate to='/login' />}
				/>
				<Route
					path='/profile'
					element={isAuthenticated ? <Profile /> : <Navigate to='/login' />}
				/>
				<Route
					path='/add-income'
					element={isAuthenticated ? <AddIncome /> : <Navigate to='/login' />}
				/>
				<Route
					path='/add-expense'
					element={isAuthenticated ? <AddExpense /> : <Navigate to='/login' />}
				/>
			</Routes>
		</BrowserRouter>
	)
}
