CREATE TABLE IF NOT EXISTS native_vendors (
 id text PRIMARY KEY,
 name text NOT NULL,
 phone text NOT NULL UNIQUE,
 status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','suspended')),
 service_pincodes text[] NOT NULL DEFAULT '{}',
 accepting_orders boolean NOT NULL DEFAULT false,
 opens_at text NOT NULL DEFAULT '05:00',
 closes_at text NOT NULL DEFAULT '14:00',
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS native_vendors_status_accepting_idx ON native_vendors(status, accepting_orders);
CREATE TABLE IF NOT EXISTS native_vendor_sessions (
 token_hash text PRIMARY KEY,
 vendor_id text NOT NULL REFERENCES native_vendors(id) ON DELETE CASCADE,
 expires_at timestamptz NOT NULL,
 revoked_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 last_seen_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS native_vendor_sessions_vendor_idx ON native_vendor_sessions(vendor_id, expires_at DESC);
CREATE TABLE IF NOT EXISTS native_vendor_inventory (
 vendor_id text NOT NULL REFERENCES native_vendors(id) ON DELETE CASCADE,
 product_key text NOT NULL CHECK (product_key IN ('egg','water','milk','curd')),
 stock_units integer NOT NULL DEFAULT 0 CHECK (stock_units >= 0),
 low_stock_at integer NOT NULL DEFAULT 10 CHECK (low_stock_at >= 0),
 available boolean NOT NULL DEFAULT true,
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (vendor_id, product_key)
);
ALTER TABLE native_orders ADD COLUMN IF NOT EXISTS vendor_id text REFERENCES native_vendors(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS native_orders_vendor_status_created_idx ON native_orders(vendor_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS native_vendors_service_pincodes_gin_idx ON native_vendors USING gin(service_pincodes);
