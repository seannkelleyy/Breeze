-- Add original_loan_amount to liabilities table
ALTER TABLE "liabilities"
  ADD COLUMN IF NOT EXISTS "original_loan_amount" numeric(14,2);
