import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../../../lib/providers/ThemeProvider'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

/** ThemeToggle component for switching between light, dark, and system themes.
 * @returns {JSX.Element} The ThemeToggle component.
 */
const ThemeToggle = () => {
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
				className='bg-background border border-border rounded-md'
			>
				<DropdownMenuItem
					className='hover:cursor-pointer hover:bg-border rounded-md p-1 my-1'
					onClick={() => setTheme('light')}
				>
					Light
				</DropdownMenuItem>
				<DropdownMenuSeparator className='h-[1px] bg-border my-.5' />
				<DropdownMenuItem
					className='hover:cursor-pointer hover:bg-border rounded-md p-1 my-1'
					onClick={() => setTheme('dark')}
				>
					Dark
				</DropdownMenuItem>
				<DropdownMenuSeparator className='h-[1px] bg-border my-.5' />
				<DropdownMenuItem
					className='hover:cursor-pointer hover:bg-border rounded-md p-1 my-1'
					onClick={() => setTheme('system')}
				>
					System
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}

export default ThemeToggle

