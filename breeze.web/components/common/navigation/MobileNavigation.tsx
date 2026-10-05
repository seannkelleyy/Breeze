'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { routeNavItems, secondaryNavItems } from './navConfig';
import { UserMenu } from '../auth/UserMenu';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';

export const MobileNavigation = () => {
  const pathname = usePathname();

  // Bottom tab bar shows the core categories; the rest live under "More".
  const tabs = routeNavItems;
  const more = secondaryNavItems;

  const isActive = (to: string) => (to === '/' ? pathname === '/' : pathname.startsWith(to));

  return (
    <>
      {/* Top bar — logo + auth only */}
      <div className="fixed top-0 z-10 flex w-full items-center justify-between border-none bg-white/2 px-4 backdrop-blur-lg sm:hidden">
        <Image className="dark:invert" src="/b.svg" alt="Breeze" width={36} height={36} />
        <UserMenu />
      </div>

      {/* Bottom tab bar */}
      <nav className="bg-background/80 fixed bottom-0 z-10 flex w-full items-center justify-around border-t backdrop-blur-lg sm:hidden">
        {tabs.map((tab) => {
          const active = isActive(tab.to);
          return (
            <Link
              key={tab.label}
              href={tab.to}
              className={cn(
                'flex flex-1 flex-col items-center gap-0.5 py-2 text-xs transition-colors',
                active ? 'text-primary-foreground' : 'text-muted-foreground',
              )}
            >
              <div
                className={cn(
                  'flex size-8 items-center justify-center rounded-full transition-colors',
                  active && 'bg-primary',
                )}
              >
                <tab.icon className="h-5 w-5" />
              </div>
              {tab.label}
            </Link>
          );
        })}

        {/* More — secondary routes (Budget, Mortgage, Connections, Taxes) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                'flex flex-1 flex-col items-center gap-0.5 py-2 text-xs transition-colors',
                more.some((item) => isActive(item.to))
                  ? 'text-primary-foreground'
                  : 'text-muted-foreground',
              )}
            >
              <div
                className={cn(
                  'flex size-8 items-center justify-center rounded-full transition-colors',
                  more.some((item) => isActive(item.to)) && 'bg-primary',
                )}
              >
                <MoreHorizontal className="h-5 w-5" />
              </div>
              More
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="center" className="mb-2 sm:hidden">
            {more.map((item) => {
              const active = isActive(item.to);
              return (
                <DropdownMenuItem key={item.label} asChild>
                  <Link
                    href={item.to}
                    title={item.title}
                    className={cn('flex items-center gap-2', active && 'text-primary')}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
    </>
  );
};
