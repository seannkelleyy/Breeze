-- Add plaid_account_id column to assets and liabilities for linking to Plaid accounts

ALTER TABLE assets ADD COLUMN plaid_account_id uuid;
ALTER TABLE assets ADD CONSTRAINT fk_assets_plaid_account
  FOREIGN KEY (plaid_account_id) REFERENCES plaid_accounts(id) ON DELETE SET NULL;

ALTER TABLE liabilities ADD COLUMN plaid_account_id uuid;
ALTER TABLE liabilities ADD CONSTRAINT fk_liabilities_plaid_account
  FOREIGN KEY (plaid_account_id) REFERENCES plaid_accounts(id) ON DELETE SET NULL;
