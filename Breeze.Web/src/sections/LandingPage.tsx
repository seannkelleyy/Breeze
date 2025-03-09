import { useMsal } from '@azure/msal-react'
import { AuthButton } from '../components/auth/AuthButton'
import { Button } from '../components/ui/button'
import { Link } from 'react-router-dom'

export const LandingPage = () => {
	const accounts = useMsal().instance.getAllAccounts()

	return (
		<section className='h-screen w-screen flex flex-col justify-center items-center'>
			<div className='flex flex-col justify-center items-center gap-2 h-full'>
				<h1 className='w-full text-left text-5xl font-medium'>Breeze</h1>
				<p className='w-full text-center'>The better way</p>
				<p className='w-full text-right'>
					to <span className='text-accent'>budget</span>.
				</p>
				{accounts.length > 0 ? (
					<div className='flex flex-col gap-2'>
						<p className='w-full text-center'>Welcome, {accounts[0].name}</p>
						<Link to='/'>
							<Button>Go to Dashboard</Button>
						</Link>
					</div>
				) : (
					<AuthButton />
				)}
			</div>
		</section>
	)
}

