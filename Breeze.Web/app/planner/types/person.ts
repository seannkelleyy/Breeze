export type PersonType = 'self' | 'spouse';
export type BonusMode = 'dollars' | 'salary-percent';

export type PlannerPerson = {
  id: string;
  type: PersonType;
  name: string;
  birthday: string;
  retirementAge: number;
  annualSalary: number;
  bonusMode: BonusMode;
  annualBonus: number;
  incomeGrowthRate: number;
};

export interface PlannerPersonDto {
  personType: 'self' | 'spouse';
  name: string;
  birthday: string;
  retirementAge: number;
  annualSalary: number;
  bonusMode: string;
  annualBonus: number;
  incomeGrowthRate: number;
}
