import LandingPage from './components/landing/LandingPage'
import HomePage from './components/homePage/HomePage'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import './App.css'

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
			</Routes>
		</BrowserRouter>
	)
}

export default App
