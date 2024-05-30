import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Auth0Provider } from '@auth0/auth0-react'
import { useEnvironmentVariables } from './config/environment/useEnvironmentVariables.ts'

const Main = () => {
	const { authClientId, authDomain, baseUrl } = useEnvironmentVariables()
	ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
		<React.StrictMode>
			<Auth0Provider
				clientId={authClientId}
				domain={authDomain}
				authorizationParams={{
					redirect_uri: baseUrl,
				}}
			>
				<App />
			</Auth0Provider>
		</React.StrictMode>,
	)
}

export default Main
