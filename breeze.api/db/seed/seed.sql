-- Seed data for tax_brackets
-- 2024 and 2025 IRS tax brackets for Single and Married Filing Jointly

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
  ('MFJ', 751600, 999999999, 0.37, 2025)
ON CONFLICT DO NOTHING;
