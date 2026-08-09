export type BonusMode = 'dollars' | 'salary-percent';

export type PlannerPerson = {
  id: string;
  name: string;
  birthday: string;
  retirementAge: number;
  annualSalary: number;
  bonusMode: BonusMode;
  annualBonus: number;
  incomeGrowthRate: number;
};

export interface PlannerPersonDto {
  name: string;
  birthday: string;
  retirementAge: number;
  annualSalary: number;
  bonusMode: string;
  annualBonus: number;
  incomeGrowthRate: number;
}
