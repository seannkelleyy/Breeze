import { SignUpButton, useUser } from '@clerk/clerk-react'
import { Link } from 'react-router-dom'
import { Button } from '../ui/button'
import AuthButton from '../auth/AuthButton'

export const LandingPage = () => {
	const userIsSignedIn = useUser().isSignedIn
	return (
		<section className='h-screen w-screen flex flex-col justify-center items-center'>
			<div className='flex flex-col justify-center items-center gap-2 h-full'>
				<h1 className='w-full text-left text-5xl font-medium'>Breeze</h1>
				<p className='w-full text-center'>The better way</p>
				<p className='w-full text-right'>
					to
					<b>
						<span className='text-accent'> budget</span>
					</b>
					.
				</p>
				{userIsSignedIn ? (
					<div className='flex flex-col gap-2'>
						<p className='w-full text-center'>Welcome, Test User</p>
						<Link to='/'>
							<Button>Go to Dashboard</Button>
						</Link>
					</div>
				) : (
					<div className='flex flex-col gap-2'>
						<p className='w-full text-center text-lg'>Welcome to Breeze</p>
						<AuthButton />
						<p className='w-full text-center text-sm mt-4'>Don't have an account?</p>
						<SignUpButton>
							<Button className='w-min self-center'>Sign Up</Button>
						</SignUpButton>
					</div>
				)}
			</div>
		</section>
	)
}

