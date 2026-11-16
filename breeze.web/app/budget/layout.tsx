import { BudgetDataProvider } from '../../features/budget/providers/index';

export default function BudgetLayout({ children }: { children: React.ReactNode }) {
  return <BudgetDataProvider>{children}</BudgetDataProvider>;
}
