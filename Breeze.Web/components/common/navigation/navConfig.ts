import type { LucideIcon } from 'lucide-react'
import { Github, Linkedin, Mail } from 'lucide-react'

export type ExternalNavItem = {
	label: string
	href: string
	title: string
	icon?: LucideIcon
}

export type RouteNavItem = {
	label: string
	to: string
	title: string
}

export const navLabels = {
	brandName: 'Breeze',
	routeMenuTitle: 'Breeze Tools',
} as const

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
]

export const routeNavItems: ReadonlyArray<RouteNavItem> = [
	{
		label: 'Budget Dashboard',
		to: '/budget',
		title: 'Budget Dashboard',
	},
	{
		label: 'Planner',
		to: '/planner',
		title: 'Planner',
	},
	{
		label: 'Mortgage Tools',
		to: '/mortgage',
		title: 'Mortgage Tools',
	},
]

