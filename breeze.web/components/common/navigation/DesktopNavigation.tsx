'use client';
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from '@/components/ui/menubar';
import { NavRouteItem } from './NavItems';
import {
  navGroups,
  routeNavItems,
  standaloneNavItems,
  type RouteNavItem,
} from './navConfig';
import { UserMenu } from '../auth/UserMenu';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import Link from 'next/link';

/** A group trigger is active when any child route is. */
const isGroupActive = (pathname: string, items: RouteNavItem[]) =>
  items.some((item) => (item.to === '/' ? pathname === '/' : pathname.startsWith(item.to)));

export const DesktopNavigation = () => {
  const pathname = usePathname();

  return (
    <Menubar
      title="navigation"
      className="fixed top-0 z-10 hidden w-full items-center justify-between rounded-none p-4 backdrop-blur-lg sm:flex"
    >
      {/* LEFT: logo */}
      <div className="z-10 flex items-center">
        <Image className="dark:invert" src="/b.svg" alt="Breeze" width={30} height={30} />
      </div>

      {/* CENTER: standalone links + grouped dropdowns */}
      <div className="z-10 flex items-center gap-1">
        {standaloneNavItems.map((item) => (
          <NavRouteItem
            key={item.label}
            label={item.label}
            to={item.to}
            title={item.title}
            icon={item.icon}
          />
        ))}
        {navGroups.map((group) => {
          const active = isGroupActive(pathname, group.items);
          return (
            <MenubarMenu key={group.label}>
              <MenubarTrigger
                title={group.title}
                className={cn(
                  'cursor-pointer rounded-md px-3 py-1.5 text-sm',
                  active && 'bg-primary text-primary-foreground',
                )}
              >
                <group.icon className="h-4 w-4" />
                {group.label}
                <ChevronDown className="h-3 w-3 opacity-60" />
              </MenubarTrigger>
              <MenubarContent>
                {group.items.map((item) => (
                  <MenubarItem asChild key={item.label}>
                    <Link
                      href={item.to}
                      title={item.title}
                      className="flex items-center gap-2 text-sm"
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  </MenubarItem>
                ))}
              </MenubarContent>
            </MenubarMenu>
          );
        })}
      </div>

      {/* RIGHT: user menu */}
      <div className="z-10 flex items-center gap-2">
        <UserMenu />
      </div>
    </Menubar>
  );
};

// routeNavItems kept referenced for the shared mobile tab list.
void routeNavItems;
