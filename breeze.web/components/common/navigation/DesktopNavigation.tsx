'use client';
import Link from 'next/link';
import { Menubar } from '@/components/ui/menubar';
import { NavRouteItem } from './NavItems';
import { routeNavItems } from './navConfig';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import { UserMenu } from '../auth/UserMenu';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Wrench } from 'lucide-react';

const toolItems = [
  { label: 'Mortgage Calculator', to: '/tools/mortgage' },
  { label: 'Plaid Connections', to: '/plaid-connections' },
];

export const DesktopNavigation = () => {
  const { budgetEnabled } = useCurrentUser();

  const visibleRouteItems = routeNavItems.filter(
    (item) => item.showWhen !== 'budget-enabled' || budgetEnabled,
  );

  return (
    <Menubar
      title="navigation"
      className="fixed top-0 z-10 hidden w-full items-center justify-between rounded-none p-4 backdrop-blur-lg sm:flex"
    >
      {/* LEFT: logo */}
      <div className="z-10 flex items-center">
        <Image className="dark:invert" src="/b.svg" alt="Breeze" width={30} height={30} />
      </div>

      {/* CENTER: route links + tools dropdown */}
      <div className="z-10 flex items-center gap-1">
        {visibleRouteItems.map((item) => (
          <NavRouteItem
            key={item.label}
            label={item.label}
            to={item.to}
            title={item.title}
            icon={item.icon}
          />
        ))}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5 text-sm">
              <Wrench className="h-4 w-4" />
              Tools
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {toolItems.map((item) => (
              <DropdownMenuItem key={item.to} asChild>
                <Link href={item.to}>{item.label}</Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* RIGHT: user menu */}
      <div className="z-10 flex items-center gap-2">
        <UserMenu />
      </div>
    </Menubar>
  );
};
