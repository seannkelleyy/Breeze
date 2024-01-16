import { LandingPage } from './components/landing/LandingPage'
import { HomePage } from './components/homePage/HomePage'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { EditBudgetPage } from './components/editBudget/EditBudget'
import { BudgetProvider } from './services/budgetContext/BudgetContext'
import Profile from './components/authentication/Profile'

const App = () => {
	return (
		<BrowserRouter>
			<BudgetProvider>
				<Routes>
					<Route
						path='/'
						element={<LandingPage />}
					/>
					<Route
						path='/Breeze'
						element={<HomePage />}
					/>
					<Route
						path='/Breeze/Budget/:year/:month'
						element={<EditBudgetPage />}
					/>
					<Route
						path='/Breeze/Profile'
						element={<Profile />}
					/>
				</Routes>
			</BudgetProvider>
		</BrowserRouter>
	)
}

export default App
