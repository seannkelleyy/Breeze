export type ProjectionRow = {
  age: number;
  totalBalance: number;
  totalContributions: number;
  investable?: number;
  property?: number;
  [key: `account-${number}`]: number;
};
