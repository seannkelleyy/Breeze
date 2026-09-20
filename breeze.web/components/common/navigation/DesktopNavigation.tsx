'use client';
import { Menubar } from '@/components/ui/menubar';
import { NavRouteItem } from './NavItems';
import { routeNavItems, secondaryNavItems } from './navConfig';
import { UserMenu } from '../auth/UserMenu';
import Image from 'next/image';

export const DesktopNavigation = () => {
  return (
    <Menubar
      title="navigation"
      className="fixed top-0 z-10 hidden w-full items-center justify-between rounded-none p-4 backdrop-blur-lg sm:flex"
    >
      {/* LEFT: logo */}
      <div className="z-10 flex items-center">
        <Image className="dark:invert" src="/b.svg" alt="Breeze" width={30} height={30} />
      </div>

      {/* CENTER: route links */}
      <div className="z-10 flex items-center gap-1">
        {routeNavItems.map((item) => (
          <NavRouteItem
            key={item.label}
            label={item.label}
            to={item.to}
            title={item.title}
            icon={item.icon}
          />
        ))}
        {secondaryNavItems.map((item) => (
          <NavRouteItem
            key={item.label}
            label={item.label}
            to={item.to}
            title={item.title}
            icon={item.icon}
          />
        ))}
      </div>

      {/* RIGHT: user menu */}
      <div className="z-10 flex items-center gap-2">
        <UserMenu />
      </div>
    </Menubar>
  );
};
