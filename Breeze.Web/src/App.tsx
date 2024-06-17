import { BudgetProvider } from './services/providers/BudgetProvider'
import { QueryClient, QueryClientProvider } from 'react-query'
import { ReactQueryDevtools } from 'react-query/devtools'
import { AppRoutes } from './config/routing/Routes'
import { DateProvider } from './services/providers/DateProvider'

const App = () => {
	const queryClient = new QueryClient()

	return (
		<QueryClientProvider client={queryClient}>
			<DateProvider>
				<BudgetProvider>
					<AppRoutes />
					<ReactQueryDevtools />
				</BudgetProvider>
			</DateProvider>
		</QueryClientProvider>
	)
}

export default App
