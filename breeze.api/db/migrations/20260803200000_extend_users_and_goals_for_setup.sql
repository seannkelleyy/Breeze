-- Extend users table for setup wizard and budget preferences
ALTER TABLE users ADD COLUMN budget_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN monthly_expenses NUMERIC(12,2);
ALTER TABLE users ADD COLUMN setup_completed BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN disclaimer_accepted BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN disclaimer_accepted_at TIMESTAMPTZ;

-- Extend goals table for enhanced goal tracking
ALTER TABLE goals ADD COLUMN target_amount NUMERIC(14,2);
ALTER TABLE goals ADD COLUMN target_date DATE;
ALTER TABLE goals ADD COLUMN category VARCHAR(50);
ALTER TABLE goals ADD COLUMN custom_category VARCHAR(100);
ALTER TABLE goals ADD COLUMN priority INTEGER NOT NULL DEFAULT 0;
ALTER TABLE goals ADD COLUMN notes TEXT;
ALTER TABLE goals ADD COLUMN connected_account_ids UUID[] NOT NULL DEFAULT '{}';
ALTER TABLE goals ADD COLUMN is_financial_order_step BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE goals ADD COLUMN financial_order_step INTEGER;

-- Index for financial order steps
CREATE INDEX idx_goals_financial_order ON goals (user_id, financial_order_step)
WHERE is_financial_order_step = true AND deleted_at IS NULL;
