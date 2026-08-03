-- Create Plaid connection and account tables
CREATE TABLE public.plaid_connections (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  environment varchar(32) NOT NULL,
  institution_id varchar(255),
  institution_name varchar(255),
  access_token text NOT NULL,
  item_id varchar(255) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_plaid_connections_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);
CREATE INDEX idx_plaid_connections_user_id ON public.plaid_connections(user_id);

CREATE TABLE public.plaid_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  plaid_connection_id uuid NOT NULL,
  external_id varchar(255) NOT NULL,
  name varchar(255) NOT NULL,
  official_name varchar(255),
  type varchar(128),
  subtype varchar(128),
  current_balance numeric(14,2),
  iso_currency_code varchar(8),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_plaid_accounts_connection FOREIGN KEY (plaid_connection_id) REFERENCES public.plaid_connections(id) ON DELETE CASCADE
);
CREATE INDEX idx_plaid_accounts_connection_id ON public.plaid_accounts(plaid_connection_id);
CREATE UNIQUE INDEX idx_plaid_accounts_external_id ON public.plaid_accounts(external_id);
