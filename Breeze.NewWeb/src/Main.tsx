import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { AppRoutes } from './config/routing/AppRoutes'
import { MsalProvider } from '@azure/msal-react'
import { useMsalInstance } from './config/auth/MsalInstance'
import { QueryClient, QueryClientProvider } from 'react-query'
import { ThemeProvider } from './components/theme/ThemeProvider'

// eslint-disable-next-line react-refresh/only-export-components
const Root = () => {
	const queryClient = new QueryClient()
	const msalInstance = useMsalInstance()
	return (
		<StrictMode>
			<MsalProvider instance={msalInstance}>
				<QueryClientProvider client={queryClient}>
					<ThemeProvider defaultTheme='system'>
						<AppRoutes />
					</ThemeProvider>
				</QueryClientProvider>
			</MsalProvider>
		</StrictMode>
	)
}

createRoot(document.getElementById('root')!).render(<Root />)

