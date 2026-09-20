-- Extend income_source_type with PEOPLE_PAYROLL: paycheck income rows derived
-- from planner people (per-person payday net amounts computed by the client).
ALTER TYPE income_source_type RENAME TO income_source_type_old;

CREATE TYPE income_source_type AS ENUM ('MANUAL', 'RECURRING_TEMPLATE', 'PEOPLE_PAYROLL');

ALTER TABLE income ALTER COLUMN source_type DROP DEFAULT;

ALTER TABLE income
  ALTER COLUMN source_type TYPE income_source_type
  USING source_type::text::income_source_type;

ALTER TABLE income ALTER COLUMN source_type SET DEFAULT 'MANUAL';

DROP TYPE income_source_type_old;
