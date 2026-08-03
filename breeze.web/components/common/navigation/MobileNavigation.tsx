'use client';
import {
  Menubar,
  MenubarContent,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from '@/components/ui/menubar';
import { NavExternalItem, NavRouteItem } from './NavItems';
import { externalNavItems, navLabels, routeNavItems } from './navConfig';
import { UserPreferencesModal } from '../userPreference/UserPreferencesModal';
import BreezeAuthButton from '../auth/BreezeAuthButton';
import ThemeToggle from '../theme/ThemeToggle';
import Image from 'next/image';

/**
 * MobileNavigation component to render the navigation bar on mobile screens.
 * @returns {JSX.Element} The MobileNavigation component.
 */
export const MobileNavigation = () => {
  return (
    <Menubar className="fixed top-0 z-10 flex w-full justify-between border-none bg-white/2 px-4 backdrop-blur-lg sm:hidden">
      <MenubarMenu>
        <MenubarTrigger>
          <Image className="dark:invert" src="/SK.png" alt="SK Logo" width={40} height={40} />
        </MenubarTrigger>
        <MenubarContent className="flex flex-col">
          {externalNavItems.map((item, index) => (
            <div key={item.label}>
              <NavExternalItem
                label={item.label}
                href={item.href}
                title={item.title}
                icon={item.icon}
              />
              {index < externalNavItems.length - 1 ? <MenubarSeparator /> : null}
            </div>
          ))}
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>{navLabels.routeMenuTitle}</MenubarTrigger>
        <MenubarContent className="flex flex-col">
          {routeNavItems.map((item, index) => (
            <div key={item.label}>
              <NavRouteItem label={item.label} to={item.to} title={item.title} />
              {index < routeNavItems.length - 1 ? <MenubarSeparator /> : null}
            </div>
          ))}
        </MenubarContent>
      </MenubarMenu>
      <UserPreferencesModal />
      <ThemeToggle />
      <BreezeAuthButton />
    </Menubar>
  );
};
