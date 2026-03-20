'use client'
import { Menubar, MenubarContent, MenubarMenu, MenubarSeparator, MenubarTrigger } from '@/components/ui/menubar'
import ThemeToggle from '../theme/ThemeToggle'
import { UserPreferencesModal } from '../userPreference/UserPreferencesModal'
import { NavExternalItem, NavRouteItem } from './NavItems'
import { externalNavItems, navLabels, routeNavItems } from './navConfig'
import BreezeAuthButton from '../auth/BreezeAuthButton'

/**
 * DesktopNavigation component for rendering the navigation bar on desktop screens.
 * @returns {JSX.Element} The DesktopNavigation component.
 */
export const DesktopNavigation = () => {
	return (
		<Menubar
			title='navigation'
			className='hidden sm:flex fixed top-0 w-full px-4 justify-between backdrop-blur-lg z-10 items-center relative'
		>
			<div className='flex justify-start items-center gap-2 z-10'>
				<MenubarMenu>
					<MenubarTrigger>
						<img
							className='dark:invert'
							src='/SK.png'
							alt='SK Logo'
							width={40}
							height={40}
						/>
					</MenubarTrigger>
					<MenubarContent className='flex flex-col'>
						{externalNavItems.map((item, index) => (
							<div key={item.label}>
								<NavExternalItem
									label={item.label}
									href={item.href}
									title={item.title}
									icon={item.icon}
								/>
								{index < externalNavItems.length - 1 ? <MenubarSeparator /> : null}
							</div>
						))}
					</MenubarContent>
				</MenubarMenu>
				{routeNavItems.map((item, index) => (
					<div
						key={item.label}
						className='flex items-center'
					>
						<NavRouteItem
							label={item.label}
							to={item.to}
							title={item.title}
						/>
						{index < routeNavItems.length - 1 ? <MenubarSeparator /> : null}
					</div>
				))}
			</div>
			<h1 className='font-thin text-3xl absolute left-1/2 -translate-x-1/2'>
				<u>{navLabels.brandName}</u>
			</h1>
			<div className='flex justify-end items-center gap-2 z-10'>
				<UserPreferencesModal />
				<ThemeToggle />
				<BreezeAuthButton />
			</div>
		</Menubar>
	)
}

