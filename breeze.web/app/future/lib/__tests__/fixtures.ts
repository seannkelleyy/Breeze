import type { TaxYearTables } from '../../types/tax';

/** 2025 IRS tables, Single — mirrors the seeded API data. */
export const SINGLE_2025_TABLES: TaxYearTables = {
  year: 2025,
  brackets: [
    { minimum: 0, maximum: 11925, rate: 0.1 },
    { minimum: 11925, maximum: 48475, rate: 0.12 },
    { minimum: 48475, maximum: 103350, rate: 0.22 },
    { minimum: 103350, maximum: 197300, rate: 0.24 },
    { minimum: 197300, maximum: 250525, rate: 0.32 },
    { minimum: 250525, maximum: 626350, rate: 0.35 },
    { minimum: 626350, maximum: null, rate: 0.37 },
  ],
  standardDeduction: 15000,
  ssWageBase: 176100,
};

/** 2025 IRS tables, Married Filing Jointly — mirrors the seeded API data. */
export const MFJ_2025_TABLES: TaxYearTables = {
  year: 2025,
  brackets: [
    { minimum: 0, maximum: 23850, rate: 0.1 },
    { minimum: 23850, maximum: 96950, rate: 0.12 },
    { minimum: 96950, maximum: 206700, rate: 0.22 },
    { minimum: 206700, maximum: 394600, rate: 0.24 },
    { minimum: 394600, maximum: 501050, rate: 0.32 },
    { minimum: 501050, maximum: 751600, rate: 0.35 },
    { minimum: 751600, maximum: null, rate: 0.37 },
  ],
  standardDeduction: 30000,
  ssWageBase: 176100,
};
