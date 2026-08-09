import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  TrendingUp,
  Wallet,
  Home,
  LinkIcon,
  Users,
  Target,
  UserRound,
} from 'lucide-react';

export type RouteNavItem = {
  label: string;
  to: string;
  title: string;
  icon: LucideIcon;
  showWhen?: 'budget-enabled';
};

export type ToolNavItem = {
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
    label: 'Budget',
    to: '/budget',
    title: 'Budget',
    icon: Wallet,
    showWhen: 'budget-enabled',
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

export const toolNavItems: ReadonlyArray<ToolNavItem> = [
  {
    label: 'Mortgage',
    to: '/tools/mortgage',
    title: 'Mortgage Calculator',
    icon: Home,
  },
  {
    label: 'Plaid',
    to: '/plaid-connections',
    title: 'Plaid Connections',
    icon: LinkIcon,
  },
];
