import { Github, Linkedin, Mail } from 'lucide-react'
import { ModeToggle } from '../theme/ModeToggle'
import { Button } from '../ui/button'
import AuthButton from '../auth/AuthButton'

export const DesktopNavigation = () => {
	return (
		<section
			title='navigation'
			className='hidden sm:flex fixed top-0 w-full px-4 justify-between backdrop-blur-lg z-10 items-center'
		>
			<div className='flex justify-start items-center gap-2'>
				<img
					className='dark:invert'
					src='/SK.png'
					alt='SK Logo'
					width={40}
					height={40}
				/>
				<Button variant='ghost'>
					<a
						href='https://www.timer.seannkelleyy.com'
						target='_blank'
						rel='noopener noreferrer'
						title='Pomodoro Timer'
					>
						Pomodoro
					</a>
				</Button>
				<Button variant='ghost'>
					<a
						href='https://www.seannkelleyy.com'
						target='_blank'
						rel='noopener noreferrer'
						title='Portfolio'
					>
						Portfolio
					</a>
				</Button>
			</div>
			<h1 className='font-thin text-3xl'>
				<u>Breeze</u>
			</h1>
			<div className='flex justify-end items-center gap-2'>
				<Button variant='ghost'>
					<a
						href='https://github.com/seannkelleyy'
						target='_blank'
						rel='noopener noreferrer'
						title='GitHub Profile'
					>
						<Github />
					</a>
				</Button>
				<Button variant='ghost'>
					<a
						href='https://www.linkedin.com/in/seankelley15/'
						target='_blank'
						rel='noopener noreferrer'
						title='LinkedIn Profile'
					>
						<Linkedin />
					</a>
				</Button>
				<Button variant='ghost'>
					<a
						href='mailto:seannkelleyy1@gmail.com'
						target='_blank'
						rel='noopener noreferrer'
						title='Email Me'
					>
						<Mail />
					</a>
				</Button>
				<ModeToggle />
				<AuthButton />
			</div>
		</section>
	)
}

