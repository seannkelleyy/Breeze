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
  Percent,
} from 'lucide-react';

export type RouteNavItem = {
  label: string;
  to: string;
  title: string;
  icon: LucideIcon;
};

export type NavGroup = {
  label: string;
  title: string;
  icon: LucideIcon;
  items: RouteNavItem[];
};

// ── Individual routes (defined once, referenced everywhere) ──

const dashboard: RouteNavItem = {
  label: 'Dashboard',
  to: '/',
  title: 'Dashboard',
  icon: LayoutDashboard,
};
const people: RouteNavItem = {
  label: 'People',
  to: '/people',
  title: 'People',
  icon: UserRound,
};
const accounts: RouteNavItem = {
  label: 'Accounts',
  to: '/accounts',
  title: 'Accounts',
  icon: Users,
};
const expenses: RouteNavItem = {
  label: 'Expenses',
  to: '/expenses',
  title: 'Expenses',
  icon: Receipt,
};
const future: RouteNavItem = {
  label: 'Future',
  to: '/future',
  title: 'Future',
  icon: TrendingUp,
};
const goals: RouteNavItem = {
  label: 'Goals',
  to: '/goals',
  title: 'Goals',
  icon: Target,
};
const budget: RouteNavItem = {
  label: 'Budget',
  to: '/budget',
  title: 'Budget',
  icon: Wallet,
};
const mortgage: RouteNavItem = {
  label: 'Mortgage',
  to: '/mortgage',
  title: 'Mortgage Calculator',
  icon: Calculator,
};
const connections: RouteNavItem = {
  label: 'Connections',
  to: '/plaid-connections',
  title: 'Plaid Connections',
  icon: Link2,
};
const taxes: RouteNavItem = {
  label: 'Taxes',
  to: '/taxes',
  title: 'Taxes',
  icon: Percent,
};

// ── Mobile bottom tab bar: core categories ──

export const routeNavItems: ReadonlyArray<RouteNavItem> = [
  dashboard,
  people,
  accounts,
  expenses,
  future,
  goals,
];

// ── Secondary routes: reached via the mobile "More" menu ──

export const secondaryNavItems: ReadonlyArray<RouteNavItem> = [
  budget,
  mortgage,
  connections,
  taxes,
];

// ── Desktop nav bar: standalone links + grouped dropdowns ──

/** Standalone desktop links, in order. */
export const standaloneNavItems: ReadonlyArray<RouteNavItem> = [dashboard, people];

/** Grouped desktop dropdowns, in order. */
export const navGroups: ReadonlyArray<NavGroup> = [
  {
    label: 'Money',
    title: 'Accounts, spending, budgets, and bank connections',
    icon: Wallet,
    items: [accounts, expenses, budget, connections],
  },
  {
    label: 'Plan',
    title: 'Projections, goals, and taxes',
    icon: TrendingUp,
    items: [future, goals, taxes, mortgage],
  },
];
