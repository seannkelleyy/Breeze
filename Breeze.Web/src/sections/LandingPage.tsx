import { Button } from '../components/ui/button'
import { Link } from 'react-router-dom'

export const LandingPage = () => {
	const users = 10 // Replace with actual user count from your state or context
	return (
		<section className='h-screen w-screen flex flex-col justify-center items-center'>
			<div className='flex flex-col justify-center items-center gap-2 h-full'>
				<h1 className='w-full text-left text-5xl font-medium'>Breeze</h1>
				<p className='w-full text-center'>The better way</p>
				<p className='w-full text-right'>
					to <span className='text-accent'>budget</span>.
				</p>
				{users > 0 ? (
					<div className='flex flex-col gap-2'>
						<p className='w-full text-center'>Welcome, {'Test use'}</p>
						<Link to='/'>
							<Button>Go to Dashboard</Button>
						</Link>
					</div>
				) : (
					<div className='flex flex-col gap-2'>
						<p className='w-full text-center'>Welcome to Breeze</p>
						<Link to='/login'>
							<Button>Login</Button>
						</Link>
					</div>
				)}
			</div>
		</section>
	)
}

