'use client';
import { Menubar, MenubarContent, MenubarMenu, MenubarTrigger } from '@/components/ui/menubar';
import ThemeToggle from '../theme/ThemeToggle';
import { UserPreferencesModal } from '../userPreference/UserPreferencesModal';
import { NavRouteItem } from './NavItems';
import { routeNavItems, toolNavItems } from './navConfig';
import { useCurrentUser } from '@/lib/providers/CurrentUserProvider';
import BreezeAuthButton from '../auth/BreezeAuthButton';
import Image from 'next/image';
import { Wrench } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export const DesktopNavigation = () => {
  const pathname = usePathname();
  const isToolsActive = pathname.startsWith('/tools');
  const { budgetEnabled } = useCurrentUser();

  const visibleRouteItems = routeNavItems.filter(
    (item) => item.showWhen !== 'budget-enabled' || budgetEnabled,
  );

  return (
    <Menubar
      title="navigation"
      className="fixed relative top-0 z-10 hidden w-full items-center justify-between px-4 backdrop-blur-lg sm:flex"
    >
      {/* LEFT: logo */}
      <div className="z-10 flex items-center">
        <Image className="dark:invert" src="/b.svg" alt="Breeze" width={40} height={40} />
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

        <MenubarMenu>
          <MenubarTrigger
            className={cn(
              'flex cursor-pointer items-center gap-1.5',
              isToolsActive && 'bg-primary text-primary-foreground',
            )}
          >
            <Wrench className="h-4 w-4" />
            Tools
          </MenubarTrigger>
          <MenubarContent className="flex flex-col">
            {toolNavItems.map((item) => (
              <NavRouteItem
                key={item.label}
                label={item.label}
                to={item.to}
                title={item.title}
                icon={item.icon}
              />
            ))}
          </MenubarContent>
        </MenubarMenu>
      </div>

      {/* RIGHT: preferences, theme, auth */}
      <div className="z-10 flex items-center gap-2">
        <UserPreferencesModal />
        <ThemeToggle />
        <BreezeAuthButton />
      </div>
    </Menubar>
  );
};
