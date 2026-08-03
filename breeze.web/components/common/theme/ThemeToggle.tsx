import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../../lib/providers/ThemeProvider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

/** ThemeToggle component for switching between light, dark, and system themes.
 * @returns {JSX.Element} The ThemeToggle component.
 */
const ThemeToggle = () => {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-background border-border rounded-md border">
        <DropdownMenuItem
          className="hover:bg-muted my-1 rounded-md p-1 hover:cursor-pointer"
          onClick={() => setTheme('light')}
        >
          Light
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-border my-.5 h-[1px]" />
        <DropdownMenuItem
          className="hover:bg-muted my-1 rounded-md p-1 hover:cursor-pointer"
          onClick={() => setTheme('dark')}
        >
          Dark
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-border my-.5 h-[1px]" />
        <DropdownMenuItem
          className="hover:bg-muted my-1 rounded-md p-1 hover:cursor-pointer"
          onClick={() => setTheme('system')}
        >
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeToggle;
