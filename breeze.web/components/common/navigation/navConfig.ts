import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  Target,
  UserRound,
  Receipt,
  Wallet,
  Calculator,
  Link2,
} from 'lucide-react';

export type RouteNavItem = {
  label: string;
  to: string;
  title: string;
  icon: LucideIcon;
};

/** Core routes — the desktop nav bar and the mobile bottom tab bar. */
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

/** Secondary routes — desktop nav bar only (former Tools dropdown contents). */
export const secondaryNavItems: ReadonlyArray<RouteNavItem> = [
  {
    label: 'Budget',
    to: '/budget',
    title: 'Budget',
    icon: Wallet,
  },
  {
    label: 'Mortgage',
    to: '/mortgage',
    title: 'Mortgage Calculator',
    icon: Calculator,
  },
  {
    label: 'Connections',
    to: '/plaid-connections',
    title: 'Plaid Connections',
    icon: Link2,
  },
];
