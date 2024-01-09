import LandingPage from './components/landing/LandingPage'
import HomePage from './components/homePage/HomePage'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AddBudgetPage } from './components/addEditBudget/AddEditBudget'
import { CreateIncome } from './components/addEditBudget/income/CreateIncome'
import { CreateCategory } from './components/addEditBudget/category/CreateCategory'
import { BudgetProvider } from './services/budgetContext/BudgetContext'

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
						element={<AddBudgetPage />}
					/>
					<Route
						path='/Breeze/Budget/CreateIncome'
						element={<CreateIncome />}
					/>
					<Route
						path='/Breeze/Budget/CreateCategory'
						element={<CreateCategory />}
					/>
				</Routes>
			</BudgetProvider>
		</BrowserRouter>
	)
}

export default App
