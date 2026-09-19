export type BonusMode = 'dollars' | 'salary-percent';
export type BonusFrequency = 'annual' | 'quarterly' | 'monthly';
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
  paycheck?: string;
  hourlyRate: number;
  expectedHoursPerWeek: number;
  createdAt: string;
  updatedAt: string;
};

export interface PlannerPersonDto {
  name: string;
  birthday: string;
  retirementAge: number;
  annualSalary: number;
  bonusMode: string;
  bonusFrequency: string;
  annualBonus: number;
  incomeGrowthRate: number;
  payType: string;
  payDay: number;
  payCadence: string;
  paycheck: string;
  hourlyRate: number;
  expectedHoursPerWeek: number;
}
