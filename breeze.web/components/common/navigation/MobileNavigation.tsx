'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, TrendingUp, Wallet, Wrench, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import BreezeAuthButton from '../auth/BreezeAuthButton';
import Image from 'next/image';

const tabs: Array<{ label: string; to: string; icon: LucideIcon }> = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard },
  { label: 'Accounts', to: '/accounts', icon: Users },
  { label: 'Planner', to: '/planner', icon: TrendingUp },
  { label: 'Budget', to: '/budget', icon: Wallet },
  { label: 'Tools', to: '/tools', icon: Wrench },
];

export const MobileNavigation = () => {
  const pathname = usePathname();

  const isActive = (to: string) => (to === '/' ? pathname === '/' : pathname.startsWith(to));

  return (
    <>
      {/* Top bar — logo + auth only */}
      <div className="fixed top-0 z-10 flex w-full items-center justify-between border-none bg-white/2 px-4 backdrop-blur-lg sm:hidden">
        <Image className="dark:invert" src="/b.svg" alt="Breeze" width={36} height={36} />
        <BreezeAuthButton />
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
      </nav>
    </>
  );
};
