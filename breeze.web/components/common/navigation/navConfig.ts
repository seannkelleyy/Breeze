import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, TrendingUp, Wallet, Home } from 'lucide-react';

export type RouteNavItem = {
  label: string;
  to: string;
  title: string;
  icon: LucideIcon;
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
    label: 'Planner',
    to: '/planner',
    title: 'Planner',
    icon: TrendingUp,
  },
  {
    label: 'Budget',
    to: '/budget',
    title: 'Budget',
    icon: Wallet,
  },
];

export const toolNavItems: ReadonlyArray<ToolNavItem> = [
  {
    label: 'Mortgage',
    to: '/tools/mortgage',
    title: 'Mortgage Calculator',
    icon: Home,
  },
];
