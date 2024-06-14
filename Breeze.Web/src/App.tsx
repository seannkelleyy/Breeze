import { BudgetProvider } from './services/providers/BudgetProvider'
import { QueryClient, QueryClientProvider } from 'react-query'
import { ReactQueryDevtools } from 'react-query/devtools'
import { AppRoutes } from './config/routing/Routes'
import { DateProvider } from './services/providers/DateProvider'
import { GlobalToastProvider } from './services/providers/GlobalToastProvider'

const App = () => {
	const queryClient = new QueryClient()

	return (
		<QueryClientProvider client={queryClient}>
			<GlobalToastProvider>
				<DateProvider>
					<BudgetProvider>
						<ReactQueryDevtools />
						<AppRoutes />
					</BudgetProvider>
				</DateProvider>
			</GlobalToastProvider>
		</QueryClientProvider>
	)
}

export default App
