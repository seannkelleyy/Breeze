import { StrictMode } from 'react'
import './index.css'
import { AppRoutes } from './config/routing/AppRoutes'
import { QueryClient, QueryClientProvider } from 'react-query'
import { ThemeProvider } from './components/theme/ThemeProvider'
import ReactDOM from 'react-dom/client'
import './index.css'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<QueryClientProvider client={queryClient}>
			<ThemeProvider defaultTheme='system'>
				<AppRoutes />
			</ThemeProvider>
		</QueryClientProvider>
	</StrictMode>,
)

