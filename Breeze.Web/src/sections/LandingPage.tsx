import { AuthButton } from '../components/auth/AuthButton'

export const LandingPage = () => {
	return (
		<section className='h-screen w-screen flex flex-col justify-center items-center'>
			<div className='flex flex-col justify-center items-center gap-2 h-full'>
				<h1 className='w-full text-left text-5xl font-medium'>Breeze</h1>
				<p className='w-full text-center'>The better way</p>
				<p className='w-full text-right'>
					to <span className='text-accent'>budget</span>.
				</p>
				<AuthButton />
			</div>
		</section>
	)
}

