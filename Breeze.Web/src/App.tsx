import { RouterProvider } from 'react-router-dom'
import { BudgetProvider } from './services/contexts/BudgetContext'
import { QueryClient, QueryClientProvider } from 'react-query'
import { ReactQueryDevtools } from 'react-query/devtools'
import { router } from './config/routing/routes'

const App = () => {
	const queryClient = new QueryClient()

	return (
		<BudgetProvider>
			<QueryClientProvider client={queryClient}>
				<ReactQueryDevtools />
				<RouterProvider router={router} />
			</QueryClientProvider>
		</BudgetProvider>
	)
}

export default App
