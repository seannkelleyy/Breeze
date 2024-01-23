import { LandingPage } from './components/landing/LandingPage'
import { HomePage } from './components/homePage/HomePage'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { EditBudgetPage } from './components/editBudget/EditBudget'
import { BudgetProvider } from './services/budgetContext/BudgetContext'
import Profile from './components/authentication/Profile'
import { QueryClient, QueryClientProvider } from 'react-query'
import { ReactQueryDevtools } from 'react-query/devtools'
import PrivateRoutes from './components/authentication/ProtectedRoute'

const App = () => {
	const queryClient = new QueryClient()

	return (
		<BrowserRouter>
			<BudgetProvider>
				<QueryClientProvider client={queryClient}>
					<Routes>
						<Route element={<PrivateRoutes />}>
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
						</Route>
						<Route
							path='/login'
							element={<LandingPage />}
						/>
					</Routes>
					<ReactQueryDevtools />
				</QueryClientProvider>
			</BudgetProvider>
		</BrowserRouter>
	)
}

export default App
