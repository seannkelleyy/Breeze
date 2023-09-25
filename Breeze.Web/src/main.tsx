import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Auth0Provider } from '@auth0/auth0-react'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<React.StrictMode>
		<Auth0Provider
			domain='dev-r15wsyccxyjfwrqm.us.auth0.com'
			clientId='Osw8qGrmXjQe3kYYcL0ca3FdUqB9LeVd'
			authorizationParams={{
				redirect_uri: 'http://localhost:5173/Breeze',
			}}
		>
			<App />
		</Auth0Provider>
	</React.StrictMode>,
)
