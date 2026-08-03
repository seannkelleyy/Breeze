'use client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';

interface ExternalItemProps {
  label: string;
  href: string;
  title: string;
  icon?: LucideIcon;
}

interface RouteItemProps {
  label: string;
  to: string;
  title: string;
  icon: LucideIcon;
}

export const NavExternalItem = ({ label, href, title, icon: Icon }: ExternalItemProps) => {
  return (
    <Button asChild variant="ghost">
      <a href={href} target="_blank" rel="noopener noreferrer" title={title} className="flex items-center gap-1.5">
        {Icon ? <Icon className="h-4 w-4" /> : null}
        {label}
      </a>
    </Button>
  );
};

export const NavRouteItem = ({ label, to, title, icon: Icon }: RouteItemProps) => {
  const pathname = usePathname();
  const isActive = to === '/' ? pathname === '/' : pathname.startsWith(to);

  return (
    <Button
      asChild
      variant="ghost"
      className={cn(isActive && 'bg-primary text-primary-foreground')}
    >
      <Link href={to} title={title} className="flex items-center gap-1.5">
        <Icon className="h-4 w-4" />
        {label}
      </Link>
    </Button>
  );
};
