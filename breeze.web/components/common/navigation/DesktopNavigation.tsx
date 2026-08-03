'use client';
import {
  Menubar,
  MenubarContent,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from '@/components/ui/menubar';
import ThemeToggle from '../theme/ThemeToggle';
import { UserPreferencesModal } from '../userPreference/UserPreferencesModal';
import { NavExternalItem, NavRouteItem } from './NavItems';
import { externalNavItems, navLabels, routeNavItems } from './navConfig';
import BreezeAuthButton from '../auth/BreezeAuthButton';
import Image from 'next/image';

/**
 * DesktopNavigation component for rendering the navigation bar on desktop screens.
 * @returns {JSX.Element} The DesktopNavigation component.
 */
export const DesktopNavigation = () => {
  return (
    <Menubar
      title="navigation"
      className="fixed relative top-0 z-10 hidden w-full items-center justify-between px-4 backdrop-blur-lg sm:flex"
    >
      <div className="z-10 flex items-center justify-start gap-2">
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
        {routeNavItems.map((item, index) => (
          <div key={item.label} className="flex items-center">
            <NavRouteItem label={item.label} to={item.to} title={item.title} />
            {index < routeNavItems.length - 1 ? <MenubarSeparator /> : null}
          </div>
        ))}
      </div>
      <h1 className="absolute left-1/2 -translate-x-1/2 text-3xl font-thin">
        <u>{navLabels.brandName}</u>
      </h1>
      <div className="z-10 flex items-center justify-end gap-2">
        <UserPreferencesModal />
        <ThemeToggle />
        <BreezeAuthButton />
      </div>
    </Menubar>
  );
};
