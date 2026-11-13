type BonusMode = 'dollars' | 'salary-percent';
type BonusFrequency = 'annual' | 'quarterly' | 'monthly';
export type PayType = 'salary' | 'hourly' | 'commission';
export type PayCadence = 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';

export type PlannerPerson = {
  id: string;
  name: string;
  birthday: string;
  retirementAge: number;
  annualSalary: number;
  bonusMode: BonusMode;
  bonusFrequency: BonusFrequency;
  annualBonus: number;
  incomeGrowthRate: number;
  isPrimary: boolean;
  payType: PayType;
  payDay: number;
  payCadence: PayCadence;
  hourlyRate: number;
  expectedHoursPerWeek: number;
  createdAt: string;
  updatedAt: string;
};
