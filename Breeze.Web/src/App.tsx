import { LandingPage } from './components/landing/LandingPage'
import { HomePage } from './components/homePage/HomePage'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { EditBudgetPage } from './components/addEditBudget/EditBudget'
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
						element={<EditBudgetPage />}
					/>
				</Routes>
			</BudgetProvider>
		</BrowserRouter>
	)
}

export default App
