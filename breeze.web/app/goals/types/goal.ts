export interface Goal {
  id: string;
  userId: string;
  description: string;
  isCompleted: boolean;
  targetAmount: string | null;
  targetDate: string | null;
  category: string | null;
  customCategory: string | null;
  priority: number;
  notes: string | null;
  connectedAccountIds: string[];
  isFinancialOrderStep: boolean;
  financialOrderStep: number | null;
  createdAt: string;
  updatedAt: string;
}

export const GOAL_CATEGORIES = [
  { value: 'emergency_fund', label: 'Emergency Fund' },
  { value: 'debt_payoff', label: 'Debt Payoff' },
  { value: 'retirement', label: 'Retirement' },
  { value: 'home', label: 'Home' },
  { value: 'vehicle', label: 'Vehicle' },
  { value: 'travel', label: 'Travel' },
  { value: 'education', label: 'Education' },
  { value: 'wedding', label: 'Wedding' },
  { value: 'big_purchase', label: 'Big Purchase' },
  { value: 'other', label: 'Other' },
] as const;