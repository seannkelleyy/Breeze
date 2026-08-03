-- Seed development data
-- NOTE: Update the identity_provider_id below to match your Clerk user ID.
-- Find it in Clerk dashboard → Users, or from the browser console:
--   window.Clerk.user.id

DO $$
DECLARE
  v_user_id    uuid := '00000000-0000-0000-0000-000000000001';
  v_clerk_id   text := 'user_2xEu432JL508aUKhGvdOyXXypG0';
  v_person_self uuid := '00000000-0000-0000-0000-000000000011';
  v_person_spouse uuid := '00000000-0000-0000-0000-000000000012';
  v_liability_mortgage uuid := '00000000-0000-0000-0000-000000000021';
  v_liability_auto uuid := '00000000-0000-0000-0000-000000000022';
BEGIN
  -- Skip if user already exists
  IF EXISTS (SELECT 1 FROM users WHERE identity_provider_id = v_clerk_id) THEN
    RAISE NOTICE 'Seed user already exists, skipping.';
    RETURN;
  END IF;

  -- ─── User ───────────────────────────────────────────────
  INSERT INTO users (
    id, email, identity_provider_id, return_type, safe_withdrawal_rate,
    currency_type, inflation_rate, deduction_type, filing_status, payoff_strategy
  ) VALUES (
    v_user_id, 'dev@example.com', v_clerk_id,
    'REAL', 0.0400, 'USD', 0.0300, 'STANDARD', 'SINGLE', 'AVALANCHE'
  );

  -- ─── People ─────────────────────────────────────────────
  INSERT INTO planner_people (id, user_id, name, birthday, retirement_age, annual_salary, bonus_mode, annual_bonus, income_growth_rate)
  VALUES
    (v_person_self,  v_user_id, 'You',      '1992-06-15', 62, 95000, 'dollars', 5000, 3.5),
    (v_person_spouse, v_user_id, 'Partner',  '1994-03-22', 60, 78000, 'dollars', 3000, 3.0);

  -- ─── Liabilities (created first so assets can reference them) ──
  INSERT INTO liabilities (
    id, user_id, name, liability_type, current_balance, interest_rate,
    minimum_payment, target_extra_payment, payoff_priority, contribution_mode, contribution_value, person_ids
  ) VALUES
    (v_liability_mortgage, v_user_id, 'Home Mortgage', 'MORTGAGE', 285000.00, 0.0650,
     1800.00, 200.00, 1, 'monthly', 2000.00, ARRAY[v_person_self, v_person_spouse]::uuid[]),
    (v_liability_auto, v_user_id, 'Car Loan', 'AUTO_LOAN', 18500.00, 0.0590,
     380.00, 0.00, 2, 'monthly', 380.00, ARRAY[v_person_self]::uuid[]);

  -- ─── Assets ─────────────────────────────────────────────
  -- Liquid / cash
  INSERT INTO assets (
    user_id, name, asset_type, current_value, contribution_mode, contribution_value,
    employer_match_rate, employer_match_max_percent_of_salary, annual_rate, person_ids,
    purchase_date, purchase_price, home_growth_profile, vehicle_depreciation_profile, linked_liability_id
  ) VALUES
    -- Checking
    (v_user_id, 'Main Checking', 'CHECKING', 8500.00, 'monthly', 0,
     0, 0, 0.0150, ARRAY[v_person_self]::uuid[],
     NULL, NULL, NULL, NULL, NULL),
    -- Emergency fund
    (v_user_id, 'Emergency Fund', 'EMERGENCY_FUND', 22000.00, 'monthly', 500,
     0, 0, 0.0450, ARRAY[v_person_self, v_person_spouse]::uuid[],
     NULL, NULL, NULL, NULL, NULL);

  -- Retirement
  INSERT INTO assets (
    user_id, name, asset_type, current_value, contribution_mode, contribution_value,
    employer_match_rate, employer_match_max_percent_of_salary, annual_rate, person_ids,
    purchase_date, purchase_price, home_growth_profile, vehicle_depreciation_profile, linked_liability_id
  ) VALUES
    -- 401k
    (v_user_id, 'My 401(k)', '_401K', 87000.00, 'salary-percent', 8.00,
     0.5000, 0.0600, 0.0700, ARRAY[v_person_self]::uuid[],
     NULL, NULL, NULL, NULL, NULL),
    -- Spouse 401k
    (v_user_id, 'Partner 401(k)', '_401K', 52000.00, 'salary-percent', 6.00,
     0.5000, 0.0600, 0.0700, ARRAY[v_person_spouse]::uuid[],
     NULL, NULL, NULL, NULL, NULL),
    -- Roth IRA
    (v_user_id, 'My Roth IRA', 'ROTH_IRA', 34000.00, 'yearly', 7000,
     0, 0, 0.0700, ARRAY[v_person_self]::uuid[],
     NULL, NULL, NULL, NULL, NULL),
    -- HSA
    (v_user_id, 'Family HSA', 'HSA', 9200.00, 'yearly', 4300,
     0, 0, 0.0600, ARRAY[v_person_self, v_person_spouse]::uuid[],
     NULL, NULL, NULL, NULL, NULL);

  -- Brokerage
  INSERT INTO assets (
    user_id, name, asset_type, current_value, contribution_mode, contribution_value,
    employer_match_rate, employer_match_max_percent_of_salary, annual_rate, person_ids,
    purchase_date, purchase_price, home_growth_profile, vehicle_depreciation_profile, linked_liability_id
  ) VALUES
    (v_user_id, 'Taxable Brokerage', 'BROKERAGE', 45000.00, 'monthly', 1000,
     0, 0, 0.0750, ARRAY[v_person_self, v_person_spouse]::uuid[],
     NULL, NULL, NULL, NULL, NULL);

  -- Combined assets (home + vehicle with linked liabilities)
  INSERT INTO assets (
    user_id, name, asset_type, current_value, contribution_mode, contribution_value,
    employer_match_rate, employer_match_max_percent_of_salary, annual_rate, person_ids,
    purchase_date, purchase_price, home_growth_profile, vehicle_depreciation_profile, linked_liability_id
  ) VALUES
    -- Home
    (v_user_id, 'Primary Home', 'HOME', 425000.00, 'monthly', 0,
     0, 0, 0.0350, ARRAY[v_person_self, v_person_spouse]::uuid[],
     '2021-08-15', 380000.00, 'medium', NULL, v_liability_mortgage),
    -- Vehicle
    (v_user_id, 'Main Car', 'VEHICLE', 28000.00, 'monthly', 0,
     0, 0, -0.1200, ARRAY[v_person_self]::uuid[],
     '2023-03-01', 35000.00, NULL, 'medium', v_liability_auto);

  RAISE NOTICE 'Seed data inserted for user %', v_user_id;
END $$;
