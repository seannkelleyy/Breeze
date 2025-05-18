import { StrictMode } from 'react'
import './index.css'
import { AppRoutes } from './config/routing/AppRoutes'
import { QueryClient, QueryClientProvider } from 'react-query'
import { ThemeProvider } from './components/theme/ThemeProvider'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'

const queryClient = new QueryClient()

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
	throw new Error('Missing Publishable Key')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<QueryClientProvider client={queryClient}>
			<ThemeProvider defaultTheme='system'>
				<ClerkProvider
					publishableKey={PUBLISHABLE_KEY}
					afterSignOutUrl='/login'
					signInForceRedirectUrl={'/'}
				>
					<AppRoutes />
				</ClerkProvider>
			</ThemeProvider>
		</QueryClientProvider>
	</StrictMode>,
)

