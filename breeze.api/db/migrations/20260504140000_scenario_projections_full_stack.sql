-- Create "scenario_profiles" table
CREATE TABLE "public"."scenario_profiles" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "name" character varying(255) NOT NULL,
  "current_age" integer NOT NULL,
  "retirement_age" integer NOT NULL,
  "annual_spend" numeric(12,2) NOT NULL,
  "safe_withdrawal_rate" decimal(5,4) NOT NULL,
  "inflation_rate" decimal(5,4) NOT NULL,
  "return_rate" decimal(5,4) NOT NULL,
  "current_portfolio" numeric(14,2) NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_scenario_profiles_user" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "scenario_profiles_current_age_non_negative" CHECK ((current_age >= 0) AND (retirement_age >= current_age)),
  CONSTRAINT "scenario_profiles_money_positive" CHECK ((annual_spend > (0)::numeric) AND (current_portfolio >= (0)::numeric))
);
-- Create index "idx_scenario_profiles_user_id" to table: "scenario_profiles"
CREATE INDEX "idx_scenario_profiles_user_id" ON "public"."scenario_profiles" ("user_id");
-- Create index "idx_scenario_profiles_user_active" to table: "scenario_profiles"
CREATE INDEX "idx_scenario_profiles_user_active" ON "public"."scenario_profiles" ("user_id", "created_at") WHERE deleted_at IS NULL;
-- Create "scenario_overrides" table
CREATE TABLE "public"."scenario_overrides" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "scenario_profile_id" uuid NOT NULL,
  "override_key" character varying(255) NOT NULL,
  "override_value" decimal(12,4) NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_scenario_overrides_profile" FOREIGN KEY ("scenario_profile_id") REFERENCES "public"."scenario_profiles" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "idx_scenario_overrides_profile_id" to table: "scenario_overrides"
CREATE INDEX "idx_scenario_overrides_profile_id" ON "public"."scenario_overrides" ("scenario_profile_id");
-- Create index "idx_scenario_overrides_profile_active" to table: "scenario_overrides"
CREATE INDEX "idx_scenario_overrides_profile_active" ON "public"."scenario_overrides" ("scenario_profile_id", "override_key") WHERE deleted_at IS NULL;
-- Create "scenario_results_cache" table
CREATE TABLE "public"."scenario_results_cache" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "scenario_profile_id" uuid NOT NULL,
  "portfolio_at_retirement" numeric(14,2) NOT NULL,
  "required_portfolio" numeric(14,2) NOT NULL,
  "projected_depletion_age" integer NULL,
  "is_sustainable" boolean NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_scenario_results_cache_profile" FOREIGN KEY ("scenario_profile_id") REFERENCES "public"."scenario_profiles" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "idx_scenario_results_cache_profile_id" to table: "scenario_results_cache"
CREATE UNIQUE INDEX "idx_scenario_results_cache_profile_id" ON "public"."scenario_results_cache" ("scenario_profile_id");
-- Create index "idx_scenario_results_cache_profile_active" to table: "scenario_results_cache"
CREATE INDEX "idx_scenario_results_cache_profile_active" ON "public"."scenario_results_cache" ("scenario_profile_id", "created_at") WHERE deleted_at IS NULL;
