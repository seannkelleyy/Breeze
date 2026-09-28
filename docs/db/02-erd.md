# 02 — Entity-Relationship Diagram

Generated ERD of all 22 tables. **Do not edit by hand** — regenerate after any `schema.hcl` change:

```bash
node scripts/gen-erd.mjs
```

GitHub renders the diagram below natively; most editors do too (VS Code, nvim with a Mermaid preview).

```mermaid
erDiagram
    tax_brackets {
        uuid id PK
        int year
        filing_status filing_status
        "numeric(12,2)" minimum_amount
        "numeric(12,2)" maximum_amount
        "decimal(5,4)" rate
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }
    standard_deductions {
        uuid id PK
        int year
        filing_status filing_status
        "numeric(12,2)" amount
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }
    fica_parameters {
        uuid id PK
        int year
        "numeric(12,2)" ss_wage_base
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }
    users {
        uuid id PK
        "varchar(255)" email
        "varchar(255)" identity_provider_id
        return_type return_type
        "decimal(5,4)" safe_withdrawal_rate
        "varchar(10)" currency_type
        "decimal(5,4)" inflation_rate
        deduction_type deduction_type
        "numeric(12,2)" deduction_amount
        uuid max_tax_bracket_id FK
        filing_status filing_status
        payoff_strategy payoff_strategy
        boolean budget_enabled
        "numeric(12,2)" monthly_expenses
        boolean setup_completed
        boolean disclaimer_accepted
        timestamptz disclaimer_accepted_at
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }
    assets {
        uuid id PK
        uuid user_id FK
        "varchar(255)" name
        asset_type asset_type
        text tax_treatment
        "numeric(14,2)" current_value
        "sql("uuid[]")" person_ids
        "varchar(32)" contribution_mode
        "decimal(12,2)" contribution_value
        "decimal(5,4)" employer_match_rate
        "decimal(5,4)" employer_match_max_percent_of_salary
        "decimal(5,4)" annual_rate
        "varchar(32)" return_profile
        date purchase_date
        "numeric(14,2)" purchase_price
        "varchar(32)" home_growth_profile
        "varchar(32)" vehicle_depreciation_profile
        uuid linked_liability_id FK
        uuid plaid_account_id FK
        timestamptz last_value_updated_at
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }
    liabilities {
        uuid id PK
        uuid user_id FK
        "varchar(255)" name
        liability_type liability_type
        "numeric(14,2)" current_balance
        "numeric(14,2)" original_loan_amount
        "decimal(5,4)" interest_rate
        "numeric(12,2)" minimum_payment
        "numeric(12,2)" target_extra_payment
        int payoff_priority
        "sql("uuid[]")" person_ids
        "varchar(32)" contribution_mode
        "decimal(12,2)" contribution_value
        uuid plaid_account_id FK
        timestamptz last_balance_updated_at
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }
    budgets {
        uuid id PK
        uuid user_id FK
        date date
        "numeric(12,2)" monthly_income
        "numeric(12,2)" monthly_expenses
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }
    expense_categories {
        uuid id PK
        uuid user_id FK
        uuid budget_id FK
        "varchar(255)" name
        "numeric(12,2)" allocation
        "numeric(12,2)" current_spend
        expense_source_type source_type
        uuid source_template_id
        date generation_month
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }
    expenses {
        uuid id PK
        uuid user_id FK
        uuid budget_id FK
        "numeric(12,2)" amount
        date date
        "varchar(255)" description
        expense_source_type source_type
        uuid source_template_id
        date generation_month
        uuid person_id FK
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }
    goals {
        uuid id PK
        uuid user_id FK
        text description
        boolean is_completed
        "numeric(14,2)" target_amount
        date target_date
        "varchar(50)" category
        "varchar(100)" custom_category
        int priority
        text notes
        "sql("uuid[]")" connected_account_ids
        boolean is_financial_order_step
        int financial_order_step
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }
    contribution_limits {
        uuid id PK
        retirement_account_type account_type
        int tax_year
        "numeric(12,2)" annual_limit
        int catch_up_age
        "numeric(12,2)" catch_up_amount
        "numeric(12,2)" family_annual_limit
        "numeric(12,2)" super_catch_up_amount
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }
    expense_splits {
        uuid id PK
        uuid expense_id FK
        uuid category_id FK
        "numeric(12,2)" amount
        "varchar(255)" description
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }
    plaid_connections {
        uuid id PK
        uuid user_id FK
        "varchar(32)" environment
        "varchar(255)" institution_id
        "varchar(255)" institution_name
        text access_token
        "varchar(255)" item_id
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }
    plaid_accounts {
        uuid id PK
        uuid plaid_connection_id FK
        "varchar(255)" external_id
        "varchar(255)" name
        "varchar(255)" official_name
        "varchar(128)" type
        "varchar(128)" subtype
        "numeric(14,2)" current_balance
        "varchar(8)" iso_currency_code
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }
    recurring_income {
        uuid id PK
        uuid user_id FK
        "varchar(255)" name
        "numeric(12,2)" amount
        recurrence_interval recurrence_interval
        int payday_day_of_month
        date start_date
        date end_date
        uuid person_id FK
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }
    income {
        uuid id PK
        uuid user_id FK
        uuid budget_id FK
        "varchar(255)" name
        "numeric(12,2)" amount
        date date
        income_source_type source_type
        uuid source_template_id FK
        date source_occurrence_date
        date generation_month
        uuid person_id FK
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }
    net_worth_snapshots {
        uuid id PK
        uuid user_id FK
        date snapshot_date
        "numeric(15,2)" total_assets
        "numeric(15,2)" total_liabilities
        "numeric(15,2)" net_worth
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }
    net_worth_snapshot_items {
        uuid id PK
        uuid snapshot_id FK
        uuid account_id FK
        text label
        "numeric(15,2)" amount
        text kind
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }
    transactions {
        uuid id PK
        uuid user_id FK
        uuid plaid_account_id FK
        text plaid_transaction_id
        date date
        "numeric(12,2)" amount
        text name
        uuid expense_category_id FK
        uuid expense_id FK
        boolean pending
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }
    planner_people {
        uuid id PK
        uuid user_id FK
        text name
        text birthday
        integer retirement_age
        "numeric(12,2)" annual_salary
        text bonus_mode
        text bonus_frequency
        "numeric(12,2)" annual_bonus
        "numeric(7,4)" income_growth_rate
        text pay_type
        integer pay_day
        text pay_cadence
        "numeric(8,2)" hourly_rate
        "numeric(5,2)" expected_hours_per_week
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }
    paycheck_deductions {
        uuid id PK
        uuid user_id FK
        uuid person_id FK
        "varchar(255)" name
        "numeric(12,2)" amount
        boolean pretax
        text kind
        uuid linked_account_id FK
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }
    recurring_expenses {
        uuid id PK
        uuid user_id FK
        "varchar(255)" name
        "numeric(12,2)" amount
        recurrence_interval recurrence_interval
        int payday_day_of_month
        date start_date
        date end_date
        uuid person_id FK
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }
    tax_brackets ||--o{ users : "max_tax_bracket_id"
    users ||--o{ assets : "user_id"
    liabilities ||--o{ assets : "linked_liability_id"
    plaid_accounts ||--o{ assets : "plaid_account_id"
    users ||--o{ liabilities : "user_id"
    plaid_accounts ||--o{ liabilities : "plaid_account_id"
    users ||--o{ budgets : "user_id"
    users ||--o{ expense_categories : "user_id"
    budgets ||--o{ expense_categories : "budget_id"
    users ||--o{ expenses : "user_id"
    budgets ||--o{ expenses : "budget_id"
    planner_people ||--o{ expenses : "person_id"
    users ||--o{ goals : "user_id"
    expenses ||--o{ expense_splits : "expense_id"
    expense_categories ||--o{ expense_splits : "category_id"
    users ||--o{ plaid_connections : "user_id"
    plaid_connections ||--o{ plaid_accounts : "plaid_connection_id"
    users ||--o{ recurring_income : "user_id"
    planner_people ||--o{ recurring_income : "person_id"
    users ||--o{ income : "user_id"
    budgets ||--o{ income : "budget_id"
    planner_people ||--o{ income : "person_id"
    recurring_income ||--o{ income : "source_template_id"
    users ||--o{ net_worth_snapshots : "user_id"
    net_worth_snapshots ||--o{ net_worth_snapshot_items : "snapshot_id"
    assets ||--o{ net_worth_snapshot_items : "account_id"
    users ||--o{ transactions : "user_id"
    plaid_accounts ||--o{ transactions : "plaid_account_id"
    expense_categories ||--o{ transactions : "expense_category_id"
    expenses ||--o{ transactions : "expense_id"
    users ||--o{ planner_people : "user_id"
    users ||--o{ paycheck_deductions : "user_id"
    planner_people ||--o{ paycheck_deductions : "person_id"
    assets ||--o{ paycheck_deductions : "linked_account_id"
    users ||--o{ recurring_expenses : "user_id"
    planner_people ||--o{ recurring_expenses : "person_id"
```

## Enums

| `filing_status` | `SINGLE` · `MFJ` · `MFS` · `HOH` |
| `return_type` | `REAL` · `NOMINAL` |
| `deduction_type` | `STANDARD` · `ITEMIZED` |
| `payoff_strategy` | `AVALANCHE` · `SNOWBALL` |
| `asset_type` | `CHECKING` · `EMERGENCY_FUND` · `BROKERAGE` · `_401K` · `_403B` · `_457` · `ROTH_IRA` · `TRADITIONAL_IRA` · `HSA` · `HOME` · `VEHICLE` · `OTHER` |
| `liability_type` | `MORTGAGE` · `CREDIT_CARD` · `STUDENT_LOAN` · `AUTO_LOAN` · `PERSONAL_LOAN` · `OTHER` |
| `recurrence_interval` | `NONE` · `WEEKLY` · `BIWEEKLY` · `MONTHLY` · `QUARTERLY` · `YEARLY` |
| `income_source_type` | `MANUAL` · `RECURRING_TEMPLATE` |
| `expense_source_type` | `MANUAL` · `RECURRING_TEMPLATE` |
| `retirement_account_type` | `ACCOUNT_401K` · `ACCOUNT_403B` · `ACCOUNT_457` · `ROTH_IRA` · `TRADITIONAL_IRA` · `HSA` · `OTHER` |
