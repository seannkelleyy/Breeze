import { BudgetDataProvider } from './providers/index'

export default function BudgetLayout({ children }: { children: React.ReactNode }) {
	return <BudgetDataProvider>{children}</BudgetDataProvider>
}

