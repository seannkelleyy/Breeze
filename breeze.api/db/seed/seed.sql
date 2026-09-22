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

-- IRS contribution limits (2025 and 2026 tax years).
INSERT INTO contribution_limits (account_type, tax_year, annual_limit, catch_up_age, catch_up_amount, family_annual_limit, super_catch_up_amount)
VALUES
  ('ACCOUNT_401K', 2025, 23500.00, 50, 7500.00, NULL, 11250.00),
  ('ACCOUNT_403B', 2025, 23500.00, 50, 7500.00, NULL, 11250.00),
  ('ACCOUNT_457', 2025, 23500.00, 50, 7500.00, NULL, 11250.00),
  ('ROTH_IRA', 2025, 7000.00, 50, 1100.00, NULL, 0.00),
  ('TRADITIONAL_IRA', 2025, 7000.00, 50, 1100.00, NULL, 0.00),
  ('HSA', 2025, 4300.00, 55, 1000.00, 8550.00, 0.00),
  ('ACCOUNT_401K', 2026, 24500.00, 50, 8000.00, NULL, 11250.00),
  ('ACCOUNT_403B', 2026, 24500.00, 50, 8000.00, NULL, 11250.00),
  ('ACCOUNT_457', 2026, 24500.00, 50, 8000.00, NULL, 11250.00),
  ('ROTH_IRA', 2026, 7500.00, 50, 1100.00, NULL, 0.00),
  ('TRADITIONAL_IRA', 2026, 7500.00, 50, 1100.00, NULL, 0.00),
  ('HSA', 2026, 4400.00, 55, 1000.00, 8750.00, 0.00)
ON CONFLICT (account_type, tax_year) DO UPDATE SET
  annual_limit = EXCLUDED.annual_limit,
  catch_up_age = EXCLUDED.catch_up_age,
  catch_up_amount = EXCLUDED.catch_up_amount,
  family_annual_limit = EXCLUDED.family_annual_limit,
  super_catch_up_amount = EXCLUDED.super_catch_up_amount;

INSERT INTO tax_brackets (filing_status, minimum_amount, maximum_amount, rate, year)
VALUES
  -- 2026 Single Brackets (Rev. Proc. 2025-32)
  ('SINGLE', 0, 12400, 0.10, 2026),
  ('SINGLE', 12400, 50400, 0.12, 2026),
  ('SINGLE', 50400, 105700, 0.22, 2026),
  ('SINGLE', 105700, 201775, 0.24, 2026),
  ('SINGLE', 201775, 256225, 0.32, 2026),
  ('SINGLE', 256225, 640600, 0.35, 2026),
  ('SINGLE', 640600, NULL, 0.37, 2026),
  -- 2026 Married Filing Jointly
  ('MFJ', 0, 24800, 0.10, 2026),
  ('MFJ', 24800, 100800, 0.12, 2026),
  ('MFJ', 100800, 211400, 0.22, 2026),
  ('MFJ', 211400, 403550, 0.24, 2026),
  ('MFJ', 403550, 512450, 0.32, 2026),
  ('MFJ', 512450, 768700, 0.35, 2026),
  ('MFJ', 768700, NULL, 0.37, 2026),
  -- 2026 Married Filing Separately
  ('MFS', 0, 12400, 0.10, 2026),
  ('MFS', 12400, 50400, 0.12, 2026),
  ('MFS', 50400, 105700, 0.22, 2026),
  ('MFS', 105700, 201775, 0.24, 2026),
  ('MFS', 201775, 256225, 0.32, 2026),
  ('MFS', 256225, 384350, 0.35, 2026),
  ('MFS', 384350, NULL, 0.37, 2026),
  -- 2026 Head of Household
  ('HOH', 0, 17700, 0.10, 2026),
  ('HOH', 17700, 67450, 0.12, 2026),
  ('HOH', 67450, 105700, 0.22, 2026),
  ('HOH', 105700, 201775, 0.24, 2026),
  ('HOH', 201775, 256225, 0.32, 2026),
  ('HOH', 256225, 640600, 0.35, 2026),
  ('HOH', 640600, NULL, 0.37, 2026)
ON CONFLICT DO NOTHING;

INSERT INTO standard_deductions (filing_status, amount, year)
VALUES
  ('SINGLE', 16100, 2026),
  ('MFJ', 32200, 2026),
  ('MFS', 16100, 2026),
  ('HOH', 24150, 2026)
ON CONFLICT DO NOTHING;

INSERT INTO fica_parameters (ss_wage_base, year)
VALUES
  (184500, 2026)
ON CONFLICT DO NOTHING;
