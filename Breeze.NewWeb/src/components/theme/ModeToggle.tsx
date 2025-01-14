import { Moon, Sun } from 'lucide-react'
import { useTheme } from './ThemeProvider'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@radix-ui/react-dropdown-menu'
import { Button } from '../ui/button'

export function ModeToggle() {
	const { setTheme } = useTheme()

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant='ghost'
					size='icon'
				>
					<Sun className='h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0' />
					<Moon className='absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100' />
					<span className='sr-only'>Toggle theme</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align='end'
				className='bg-background p-2 border border-border rounded-md'
			>
				<DropdownMenuItem
					className='hover:cursor-pointer hover:bg-border rounded-md p-1'
					onClick={() => setTheme('light')}
				>
					Light
				</DropdownMenuItem>
				<DropdownMenuSeparator className='h-[1px] bg-border my-.5' />
				<DropdownMenuItem
					className='hover:cursor-pointer hover:bg-border rounded-md p-1'
					onClick={() => setTheme('dark')}
				>
					Dark
				</DropdownMenuItem>
				<DropdownMenuSeparator className='h-[1px] bg-border my-.5' />
				<DropdownMenuItem
					className='hover:cursor-pointer hover:bg-border rounded-md p-1'
					onClick={() => setTheme('system')}
				>
					System
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}

