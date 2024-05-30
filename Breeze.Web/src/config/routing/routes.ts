import { createBrowserRouter, redirect } from 'react-router-dom'
import { LandingPage } from '../../pages/landing/LandingPage'
import { HomePage } from '../../pages/homePage/HomePage'
import { EditBudgetPage } from '../../pages/editBudget/EditBudget'
import { Profile } from '../../components/auth/Profile'
import { AddIncome } from '../../pages/addItems/AddIncome'
import { AddExpense } from '../../pages/addItems/AddExpense'

export const PAGE = {
    HOME: '/home',
    ROOT: '/',
    BUDGET: '/budget/:year/:month',
    PROFILE: '/profile',
    ADD_INCOME: '/add-income',
    ADD_EXPENSE: '/add-expense',
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
        path: PAGE.ADD_INCOME,
        Component: AddIncome
    },
    {
        path: PAGE.ADD_EXPENSE,
        Component:AddExpense,
    },
    {
        // redirect any invalid pages back to home
        path: '*',
        loader: () => redirect(PAGE.ROOT),
    },
])
