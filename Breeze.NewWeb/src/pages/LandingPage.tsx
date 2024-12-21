import { Button } from '../components/ui/button'
import { Navigation } from '../components/navigation/Navigation'
import { useMsal } from '@azure/msal-react'
import { loginRequest } from '../config/auth/MsalInstance'

export const LandingPage = () => {
	const { instance, accounts, inProgress } = useMsal()

	return (
		<section className='h-screen w-screen flex flex-col justify-center items-center'>
			<Navigation />
			<div className='flex flex-col justify-center items-center gap-2 h-full'>
				<h1 className='w-full text-left text-5xl font-medium'>Breeze</h1>
				<p className='w-full text-center'>The better way</p>
				<p className='w-full text-right'>to budget.</p>
				{accounts.length > 0 ? <Button onClick={() => instance.logoutPopup()}>Log out</Button> : <Button onClick={() => instance.loginPopup(loginRequest)}>Log in</Button>}
				{inProgress === 'login' && <p>Logging in...</p>}
			</div>
		</section>
	)
}

