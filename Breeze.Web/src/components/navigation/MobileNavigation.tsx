import { Github, Linkedin, Mail } from 'lucide-react'
import { ModeToggle } from '../theme/ModeToggle'
import { Button } from '../ui/button'
import { Menubar, MenubarContent, MenubarMenu, MenubarSeparator, MenubarTrigger } from '../ui/menubar'
import AuthButton from '../auth/AuthButton'

export const MobileNavigation = () => {
	return (
		<Menubar className='flex sm:hidden fixed top-0 w-full px-4 justify-between backdrop-blur-lg bg-white/2 z-10 border-none'>
			<img
				className='dark:invert'
				src='/SK.png'
				alt='SK Logo'
				width={40}
				height={40}
			/>
			<MenubarMenu>
				<MenubarTrigger>Projects</MenubarTrigger>
				<MenubarContent className='flex flex-col'>
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
					<MenubarSeparator />
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
				</MenubarContent>
			</MenubarMenu>
			<MenubarMenu>
				<MenubarTrigger>Links</MenubarTrigger>
				<MenubarContent className='flex flex-col'>
					<Button variant='ghost'>
						<a
							href='https://github.com/seannkelleyy'
							target='_blank'
							rel='noopener noreferrer'
							title='GitHub Profile'
							className='flex items-center gap-1'
						>
							<Github /> Github
						</a>
					</Button>
					<MenubarSeparator />
					<Button variant='ghost'>
						<a
							href='https://www.linkedin.com/in/seankelley15/'
							target='_blank'
							rel='noopener noreferrer'
							title='LinkedIn Profile'
							className='flex items-center gap-1'
						>
							<Linkedin /> LinkedIn
						</a>
					</Button>
					<MenubarSeparator />
					<Button variant='ghost'>
						<a
							href='mailto:seannkelleyy1@gmail.com'
							target='_blank'
							rel='noopener noreferrer'
							title='Email Me'
							className='flex items-center gap-1'
						>
							<Mail /> Email
						</a>
					</Button>
					<AuthButton />
				</MenubarContent>
			</MenubarMenu>
			<ModeToggle />
		</Menubar>
	)
}

