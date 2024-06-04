import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { LandingPage } from '../../pages/landing/LandingPage'
import { HomePage } from '../../pages/homePage/HomePage'
import { EditBudgetPage } from '../../pages/editBudget/EditBudget'
import { Profile } from '../../components/auth/Profile'
import { AddIncome } from '../../pages/addItems/AddIncome'
import { AddExpense } from '../../pages/addItems/AddExpense'
import { useAuth0 } from '@auth0/auth0-react'

export const AppRoutes = () => {
	// const { isAuthenticated, isLoading } = useAuth0()

	// if (isLoading) {
	// 	return <div>Loading...</div> // eventual loading skeleton or something of the sort
	// }

	return (
		<BrowserRouter>
			<Routes>
				<Route
					path='/'
					element={<LandingPage />}
				/>
				<Route
					path='/home'
					element={<HomePage />}
				/>
				<Route
					path='/budget/:year/:month'
					element={<EditBudgetPage />}
				/>
				<Route
					path='/profile'
					element={<Profile />}
				/>
				<Route
					path='/add-income'
					element={<AddIncome />}
				/>
				<Route
					path='/add-expense'
					element={<AddExpense />}
				/>
			</Routes>
		</BrowserRouter>
	)
}
