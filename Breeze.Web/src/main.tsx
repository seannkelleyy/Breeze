import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { Auth0Provider } from '@auth0/auth0-react'
import { useEnvironmentVariables } from './config/environment/useEnvironmentVariables'

// eslint-disable-next-line react-refresh/only-export-components
const Root = () => {
	const { authClientId, authDomain, baseLocalUrl: baseLocalUrl, baseHostedUrl, apiAudience } = useEnvironmentVariables()
	const baseUrl = import.meta.env.MODE === 'production' ? baseHostedUrl : baseLocalUrl

	return (
		<React.StrictMode>
			<Auth0Provider
				clientId={authClientId}
				domain={authDomain}
				authorizationParams={{
					redirect_uri: baseUrl,
					audience: apiAudience,
					scope: 'read:data write:data',
				}}
			>
				<App />
			</Auth0Provider>
		</React.StrictMode>
	)
}

const rootElement = document.getElementById('root')
if (rootElement) {
	const root = ReactDOM.createRoot(rootElement)
	root.render(<Root />)
}
