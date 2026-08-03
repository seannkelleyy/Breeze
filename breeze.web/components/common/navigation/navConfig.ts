import type { LucideIcon } from 'lucide-react';
import { Github, Linkedin, Mail, LayoutDashboard, TrendingUp, Wallet, Home } from 'lucide-react';

export type ExternalNavItem = {
  label: string;
  href: string;
  title: string;
  icon?: LucideIcon;
};

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

export const navLabels = {
  brandName: 'Breeze',
} as const;

export const externalNavItems: ReadonlyArray<ExternalNavItem> = [
  {
    label: 'Pomodoro',
    href: 'https://www.timer.seannkelleyy.com',
    title: 'Pomodoro Timer',
  },
  {
    label: 'Portfolio',
    href: 'https://www.seannkelleyy.com',
    title: 'Portfolio',
  },
  {
    label: 'Github',
    href: 'https://github.com/seannkelleyy',
    title: 'GitHub Profile',
    icon: Github,
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/seankelley15/',
    title: 'LinkedIn Profile',
    icon: Linkedin,
  },
  {
    label: 'Email',
    href: 'mailto:seannkelleyy1@gmail.com',
    title: 'Email Me',
    icon: Mail,
  },
];

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
