import LandingPage from './components/landing/LandingPage'
import HomePage from './components/homePage/HomePage'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AddBudgetPage } from './components/addBudget/addBudget'

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
					path='/AddBudget'
					element={<AddBudgetPage />}
				/>
			</Routes>
		</BrowserRouter>
	)
}

export default App
