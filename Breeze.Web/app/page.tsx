'use client'
import BreezeAuthButton from '@/components/common/auth/BreezeAuthButton'
import { Button } from '@/components/ui/button'
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider'
import { SignUpButton } from '@clerk/nextjs'
import Link from 'next/link'
import { Navigation } from '@/components/common/navigation'

const LandingPage = () => {
	const { user, isSignedIn } = useCurrentUser()

	const SignedIn = () => (
		<div className='flex flex-col gap-2'>
			<p className='w-full text-center'>Welcome, {user?.firstName}</p>
			<Link href='/budget'>
				<Button>Go to Dashboard</Button>
			</Link>
			<SignUpButton>
				<Button>Sign Up</Button>
			</SignUpButton>
		</div>
	)

	const SignedOut = () => (
		<div className='flex flex-col gap-2'>
			<BreezeAuthButton />
			<p className='w-full text-center text-sm mt-4'>Don't have an account?</p>
			<SignUpButton>
				<Button className='w-min self-center'>Sign Up</Button>
			</SignUpButton>
		</div>
	)
	return (
		<section className='h-screen w-screen flex flex-col justify-center items-center'>
			<div className='flex flex-col justify-center items-center gap-2 h-full'>
				<h1 className='w-full text-left text-5xl font-medium'>Breeze</h1>
				<p className='w-full text-center'>Budgeting should be a</p>
				<p className='w-full text-right'>
					<b>
						<span className='text-accent'> Breeze</span>
					</b>
					.
				</p>
				{isSignedIn ? <SignedIn /> : <SignedOut />}
			</div>
		</section>
	)
}

export default LandingPage

