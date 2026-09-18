-- Seed data for tax reference tables
-- 2024 and 2025 IRS data: brackets (all filing statuses), standard deductions, FICA parameters
-- Sources: IRS Rev. Proc. 2023-34 (2024), Rev. Proc. 2024-40 (2025); SSA contribution base announcements

INSERT INTO tax_brackets (filing_status, minimum_amount, maximum_amount, rate, year)
VALUES
  -- 2024 Single Brackets
  ('SINGLE', 0, 11600, 0.10, 2024),
  ('SINGLE', 11600, 47150, 0.12, 2024),
  ('SINGLE', 47150, 100525, 0.22, 2024),
  ('SINGLE', 100525, 191950, 0.24, 2024),
  ('SINGLE', 191950, 243725, 0.32, 2024),
  ('SINGLE', 243725, 609350, 0.35, 2024),
  ('SINGLE', 609350, 999999999, 0.37, 2024),

  -- 2024 Married Filing Jointly Brackets
  ('MFJ', 0, 23200, 0.10, 2024),
  ('MFJ', 23200, 94300, 0.12, 2024),
  ('MFJ', 94300, 201050, 0.22, 2024),
  ('MFJ', 201050, 383900, 0.24, 2024),
  ('MFJ', 383900, 487450, 0.32, 2024),
  ('MFJ', 487450, 731200, 0.35, 2024),
  ('MFJ', 731200, 999999999, 0.37, 2024),

  -- 2024 Married Filing Separately Brackets
  ('MFS', 0, 11600, 0.10, 2024),
  ('MFS', 11600, 47150, 0.12, 2024),
  ('MFS', 47150, 100525, 0.22, 2024),
  ('MFS', 100525, 191950, 0.24, 2024),
  ('MFS', 191950, 243725, 0.32, 2024),
  ('MFS', 243725, 365600, 0.35, 2024),
  ('MFS', 365600, 999999999, 0.37, 2024),

  -- 2024 Head of Household Brackets
  ('HOH', 0, 16550, 0.10, 2024),
  ('HOH', 16550, 63100, 0.12, 2024),
  ('HOH', 63100, 100500, 0.22, 2024),
  ('HOH', 100500, 191950, 0.24, 2024),
  ('HOH', 191950, 243700, 0.32, 2024),
  ('HOH', 243700, 609350, 0.35, 2024),
  ('HOH', 609350, 999999999, 0.37, 2024),

  -- 2025 Single Brackets
  ('SINGLE', 0, 11925, 0.10, 2025),
  ('SINGLE', 11925, 48475, 0.12, 2025),
  ('SINGLE', 48475, 103350, 0.22, 2025),
  ('SINGLE', 103350, 197300, 0.24, 2025),
  ('SINGLE', 197300, 250525, 0.32, 2025),
  ('SINGLE', 250525, 626350, 0.35, 2025),
  ('SINGLE', 626350, 999999999, 0.37, 2025),

  -- 2025 Married Filing Jointly Brackets
  ('MFJ', 0, 23850, 0.10, 2025),
  ('MFJ', 23850, 96950, 0.12, 2025),
  ('MFJ', 96950, 206700, 0.22, 2025),
  ('MFJ', 206700, 394600, 0.24, 2025),
  ('MFJ', 394600, 501050, 0.32, 2025),
  ('MFJ', 501050, 751600, 0.35, 2025),
  ('MFJ', 751600, 999999999, 0.37, 2025),

  -- 2025 Married Filing Separately Brackets
  ('MFS', 0, 11925, 0.10, 2025),
  ('MFS', 11925, 48475, 0.12, 2025),
  ('MFS', 48475, 103350, 0.22, 2025),
  ('MFS', 103350, 197300, 0.24, 2025),
  ('MFS', 197300, 250525, 0.32, 2025),
  ('MFS', 250525, 375800, 0.35, 2025),
  ('MFS', 375800, 999999999, 0.37, 2025),

  -- 2025 Head of Household Brackets
  ('HOH', 0, 17000, 0.10, 2025),
  ('HOH', 17000, 64850, 0.12, 2025),
  ('HOH', 64850, 103350, 0.22, 2025),
  ('HOH', 103350, 197300, 0.24, 2025),
  ('HOH', 197300, 250500, 0.32, 2025),
  ('HOH', 250500, 626350, 0.35, 2025),
  ('HOH', 626350, 999999999, 0.37, 2025)
ON CONFLICT DO NOTHING;

INSERT INTO standard_deductions (filing_status, amount, year)
VALUES
  ('SINGLE', 14600, 2024),
  ('MFJ', 29200, 2024),
  ('MFS', 14600, 2024),
  ('HOH', 21900, 2024),
  ('SINGLE', 15000, 2025),
  ('MFJ', 30000, 2025),
  ('MFS', 15000, 2025),
  ('HOH', 22500, 2025)
ON CONFLICT DO NOTHING;

INSERT INTO fica_parameters (ss_wage_base, year)
VALUES
  (168600, 2024),
  (176100, 2025)
ON CONFLICT DO NOTHING;
