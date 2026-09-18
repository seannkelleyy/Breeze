-- Create "fica_parameters" table
CREATE TABLE "fica_parameters" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "year" integer NOT NULL,
  "ss_wage_base" numeric(12,2) NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id")
);
-- Create index "idx_fica_parameters_year" to table: "fica_parameters"
CREATE INDEX "idx_fica_parameters_year" ON "fica_parameters" ("year");
-- Create "standard_deductions" table
CREATE TABLE "standard_deductions" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "year" integer NOT NULL,
  "filing_status" "filing_status" NOT NULL,
  "amount" numeric(12,2) NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id")
);
-- Create index "idx_standard_deductions_year_status" to table: "standard_deductions"
CREATE INDEX "idx_standard_deductions_year_status" ON "standard_deductions" ("year", "filing_status");
