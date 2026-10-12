export type ProjectionRow = {
  age: number;
  totalBalance: number;
  totalContributions: number;
  investable?: number;
  property?: number;
  [key: `account-${number}`]: number;
};

/** Ledger facts that turn the projection's drawdown into sequenced withdrawals. */
export type WithdrawalPlanInput = {
  /** Unreimbursed HSA receipts — the tax-free spending pool inside the HSA. */
  hsaReceiptBalance: number;
  /** Conversion principals with the date each clears its five-year clock. */
  conversionBuckets: Array<{ availableOn: string; amount: number }>;
  /** Calendar year of the projection's first year; defaults to this year. */
  currentYear?: number;
};

/** One retirement year's sequenced withdrawals, in tax order. */
export type WithdrawalRow = {
  age: number;
  year: number;
  expense: number;
  hsaReceipts: number;
  taxable: number;
  pretax: number;
  rothClocked: number;
  rothOther: number;
  shortfall: number;
  penaltyExposure: number;
  /** Taxable + pre-tax + Roth + HSA account balances at year end. */
  spendableBalance: number;
  receiptBalance: number;
};

