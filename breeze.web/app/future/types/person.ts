export type BonusMode = 'dollars' | 'salary-percent';
export type PayType = 'salary' | 'hourly' | 'commission';
export type PayCadence = 'weekly' | 'biweekly' | 'monthly';

export type PlannerPerson = {
  id: string;
  name: string;
  birthday: string;
  retirementAge: number;
  annualSalary: number;
  bonusMode: BonusMode;
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

export interface PlannerPersonDto {
  name: string;
  birthday: string;
  retirementAge: number;
  annualSalary: number;
  bonusMode: string;
  annualBonus: number;
  incomeGrowthRate: number;
  payType: string;
  payDay: number;
  payCadence: string;
  hourlyRate: number;
  expectedHoursPerWeek: number;
}
