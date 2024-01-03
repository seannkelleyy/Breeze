import LandingPage from './components/landing/LandingPage'
import HomePage from './components/homePage/HomePage'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AddBudgetPage } from './components/addEditBudget/AddEditBudget'

const App = () => {
	return (
		<BrowserRouter>
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
					path='/Breeze/AddBudget/:year/:month'
					element={<AddBudgetPage />}
				/>
			</Routes>
		</BrowserRouter>
	)
}

export default App
