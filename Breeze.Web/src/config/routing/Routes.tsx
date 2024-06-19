import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { LandingPage } from '../../pages/landing/LandingPage'
import { HomePage } from '../../pages/homePage/HomePage'
import { EditBudgetPage } from '../../pages/editBudget/EditBudget'
import { Profile } from '../../components/auth/Profile'
import { AddIncome } from '../../pages/addItems/AddIncome'
import { AddExpense } from '../../pages/addItems/AddExpense'

export const AppRoutes = () => {
	// const { isAuthenticated, isLoading } = useAuth0()

	// if (isLoading) {
	// 	return <div>Loading...</div> // eventual loading skeleton or something of the sort
	// }

	return (
		<BrowserRouter>
			<Routes>
				<Route
					path='/login'
					element={<LandingPage />}
				/>
				<Route
					path='/'
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
