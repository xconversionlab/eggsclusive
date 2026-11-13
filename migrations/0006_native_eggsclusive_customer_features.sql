-- Eggsclusive native order extensions for Water Can, customer addresses, complaints and wallet refunds.
ALTER TABLE native_orders
  ADD COLUMN IF NOT EXISTS product_type text NOT NULL DEFAULT 'egg',
  ADD COLUMN IF NOT EXISTS bottle_deposit_paise integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS empty_bottles_to_return boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS floor_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS floor_delivery_charge_paise integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending';

CREATE TABLE IF NOT EXISTS native_customer_addresses (
  id text PRIMARY KEY,
  customer_id text NOT NULL REFERENCES native_customers(id) ON DELETE CASCADE,
  label text NOT NULL,
  door text NOT NULL,
  street text NOT NULL,
  area text NOT NULL,
  landmark text NOT NULL DEFAULT '',
  city text NOT NULL,
  pincode text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS native_customer_addresses_customer_idx
  ON native_customer_addresses(customer_id, created_at);

CREATE TABLE IF NOT EXISTS native_complaints (
  id text PRIMARY KEY,
  customer_id text NOT NULL REFERENCES native_customers(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS native_complaints_status_created_idx
  ON native_complaints(status, created_at DESC);
CREATE INDEX IF NOT EXISTS native_complaints_customer_created_idx
  ON native_complaints(customer_id, created_at DESC);

CREATE TABLE IF NOT EXISTS native_customer_wallets (
  customer_id text PRIMARY KEY REFERENCES native_customers(id) ON DELETE CASCADE,
  balance_paise integer NOT NULL DEFAULT 0 CHECK (balance_paise >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS native_wallet_transactions (
  id text PRIMARY KEY,
  customer_id text NOT NULL REFERENCES native_customers(id) ON DELETE CASCADE,
  order_id text REFERENCES native_orders(id) ON DELETE SET NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('refund', 'adjustment', 'payment')),
  amount_paise integer NOT NULL CHECK (amount_paise <> 0),
  balance_after_paise integer NOT NULL CHECK (balance_after_paise >= 0),
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(order_id, transaction_type)
);
CREATE INDEX IF NOT EXISTS native_wallet_transactions_customer_created_idx
  ON native_wallet_transactions(customer_id, created_at DESC);
