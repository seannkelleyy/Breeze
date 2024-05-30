import { BudgetProvider } from './services/contexts/BudgetContext'
import { QueryClient, QueryClientProvider } from 'react-query'
import { ReactQueryDevtools } from 'react-query/devtools'
import { AppRoutes } from './config/routing/Routes'

const App = () => {
	const queryClient = new QueryClient()

	return (
		<BudgetProvider>
			<QueryClientProvider client={queryClient}>
				<ReactQueryDevtools />
				<AppRoutes />
			</QueryClientProvider>
		</BudgetProvider>
	)
}

export default App
