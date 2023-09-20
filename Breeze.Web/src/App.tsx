import LandingPage from './components/landing/LandingPage'
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
					path='/LandingPage'
					element={<LandingPage />}
				/>
			</Routes>
		</BrowserRouter>
	)
}

export default App

