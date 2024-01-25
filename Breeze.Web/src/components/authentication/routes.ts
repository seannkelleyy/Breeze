import { createBrowserRouter, redirect } from 'react-router-dom'
import { LandingPage } from '../landing/LandingPage'
import { HomePage } from '../homePage/HomePage'
import { EditBudgetPage } from '../editBudget/EditBudget'
import { Profile } from './Profile'

export const PAGE = {
    HOME: '/home',
    ROOT: '/',
    BUDGET: '/budget/:year/:month',
    PROFILE: '/profile',
}

export const router = createBrowserRouter([
    {
        path: 'authcallback',
        Component: () => null,
    },
    {
        path: PAGE.HOME,
        Component: HomePage,
    },
    // main authenticated paths
    {
        path: PAGE.ROOT,
        Component: LandingPage,
    },
    {
        path: PAGE.BUDGET,
        Component: EditBudgetPage,
    },
    {
        path: PAGE.PROFILE,
        Component: Profile,
    },
    {
        // redirect any invalid pages back to home
        path: '*',
        loader: () => redirect(PAGE.ROOT),
    },
])
