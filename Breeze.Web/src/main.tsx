import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { AppRoutes } from './config/routing/AppRoutes'
import { MsalProvider } from '@azure/msal-react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { ThemeProvider } from './components/theme/ThemeProvider'
import { PublicClientApplication } from '@azure/msal-browser'
import { msalConfig } from './config/auth/MsalConfig'

const msalInstance = new PublicClientApplication(msalConfig)

const container = document.getElementById('root')
if (container) {
	const root = createRoot(container)
	root.render(<App msalInstance={msalInstance} />)
} else {
	console.error('Root container not found')
}

type AppProps = {
	msalInstance: PublicClientApplication
}

export default function App({ msalInstance }: AppProps) {
	const queryClient = new QueryClient()

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

