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
import { externalNavItems, navLabels, routeNavItems, toolNavItems } from './navConfig';
import BreezeAuthButton from '../auth/BreezeAuthButton';
import Image from 'next/image';
import { Wrench } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export const DesktopNavigation = () => {
  const pathname = usePathname();
  const isToolsActive = pathname.startsWith('/tools');

  return (
    <Menubar
      title="navigation"
      className="fixed relative top-0 z-10 hidden w-full items-center justify-between px-4 backdrop-blur-lg sm:flex"
    >
      {/* LEFT cluster: logo dropdown + route links + tools dropdown */}
      <div className="z-10 flex items-center justify-start gap-1">
        <MenubarMenu>
          <MenubarTrigger>
            <Image className="dark:invert" src="/SK.png" alt="SK Logo" width={40} height={40} />
          </MenubarTrigger>
          <MenubarContent className="flex flex-col">
            {externalNavItems.map((item, index) => (
              <div key={item.label}>
                <NavExternalItem label={item.label} href={item.href} title={item.title} icon={item.icon} />
                {index < externalNavItems.length - 1 ? <MenubarSeparator /> : null}
              </div>
            ))}
          </MenubarContent>
        </MenubarMenu>

        <MenubarSeparator className="mx-1" />

        {routeNavItems.map((item) => (
          <NavRouteItem key={item.label} label={item.label} to={item.to} title={item.title} icon={item.icon} />
        ))}

        <MenubarMenu>
          <MenubarTrigger
            className={cn(
              'flex items-center gap-1.5 cursor-pointer',
              isToolsActive && 'bg-primary text-primary-foreground',
            )}
          >
            <Wrench className="h-4 w-4" />
            Tools
          </MenubarTrigger>
          <MenubarContent className="flex flex-col">
            {toolNavItems.map((item) => (
              <NavRouteItem key={item.label} label={item.label} to={item.to} title={item.title} icon={item.icon} />
            ))}
          </MenubarContent>
        </MenubarMenu>
      </div>

      {/* CENTER: brand name */}
      <h1 className="absolute left-1/2 -translate-x-1/2 text-3xl font-thin">
        <u>{navLabels.brandName}</u>
      </h1>

      {/* RIGHT cluster: preferences, theme, auth */}
      <div className="z-10 flex items-center justify-end gap-2">
        <UserPreferencesModal />
        <ThemeToggle />
        <BreezeAuthButton />
      </div>
    </Menubar>
  );
};
