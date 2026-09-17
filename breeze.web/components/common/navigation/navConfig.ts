import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, TrendingUp, Users, Target, UserRound, Receipt } from 'lucide-react';

export type RouteNavItem = {
  label: string;
  to: string;
  title: string;
  icon: LucideIcon;
};

export const routeNavItems: ReadonlyArray<RouteNavItem> = [
  {
    label: 'Dashboard',
    to: '/',
    title: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'People',
    to: '/people',
    title: 'People',
    icon: UserRound,
  },
  {
    label: 'Accounts',
    to: '/accounts',
    title: 'Accounts',
    icon: Users,
  },
  {
    label: 'Expenses',
    to: '/expenses',
    title: 'Expenses',
    icon: Receipt,
  },
  {
    label: 'Future',
    to: '/future',
    title: 'Future',
    icon: TrendingUp,
  },
  {
    label: 'Goals',
    to: '/goals',
    title: 'Goals',
    icon: Target,
  },
];
