import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { LandingPage } from '../../pages/landing/LandingPage'
import { HomePage } from '../../pages/homePage/HomePage'
import { EditBudgetPage } from '../../pages/editBudget/EditBudget'
import { Profile } from '../../components/auth/Profile'
import { AddIncome } from '../../pages/addItems/AddIncome'
import { AddExpense } from '../../pages/addItems/AddExpense'
import { useAuth0 } from '@auth0/auth0-react'

export const AppRoutes = () => {
	const { isAuthenticated, isLoading } = useAuth0()

	if (isLoading) {
		return <div>Loading...</div> // eventual loading skeleton or something of the sort
	}

	return (
		<BrowserRouter>
			<Routes>
				<Route
					path='/'
					element={<LandingPage />}
				/>
				<Route
					path='/home'
					element={isAuthenticated ? <HomePage /> : <Navigate to='/' />}
				/>
				<Route
					path='/budget/:year/:month'
					element={isAuthenticated ? <EditBudgetPage /> : <Navigate to='/' />}
				/>
				<Route
					path='/profile'
					element={isAuthenticated ? <Profile /> : <Navigate to='/' />}
				/>
				<Route
					path='/add-income'
					element={isAuthenticated ? <AddIncome /> : <Navigate to='/' />}
				/>
				<Route
					path='/add-expense'
					element={isAuthenticated ? <AddExpense /> : <Navigate to='/' />}
				/>
			</Routes>
		</BrowserRouter>
	)
}
