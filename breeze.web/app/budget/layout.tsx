import { BudgetDataProvider } from '@/features/budget/providers';

export default function BudgetLayout({ children }: { children: React.ReactNode }) {
  return <BudgetDataProvider>{children}</BudgetDataProvider>;
}
