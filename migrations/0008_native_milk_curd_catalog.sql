-- Customer address pins are optional; a complete typed address is sufficient for checkout.
ALTER TABLE native_customer_addresses
  ALTER COLUMN latitude DROP NOT NULL,
  ALTER COLUMN longitude DROP NOT NULL;

-- Customers can order any enabled product instead of always being forced to add eggs.
ALTER TABLE native_orders DROP CONSTRAINT IF EXISTS native_orders_quantity_check;
ALTER TABLE native_orders
  ADD CONSTRAINT native_orders_quantity_nonnegative_check
  CHECK (quantity >= 0 AND quantity <= 360);

ALTER TABLE native_orders
  ADD COLUMN IF NOT EXISTS milk_quantity integer NOT NULL DEFAULT 0
    CHECK (milk_quantity >= 0 AND milk_quantity <= 60),
  ADD COLUMN IF NOT EXISTS curd_quantity integer NOT NULL DEFAULT 0
    CHECK (curd_quantity >= 0 AND curd_quantity <= 60),
  ADD COLUMN IF NOT EXISTS milk_unit_price_paise integer NOT NULL DEFAULT 0
    CHECK (milk_unit_price_paise >= 0),
  ADD COLUMN IF NOT EXISTS curd_unit_price_paise integer NOT NULL DEFAULT 0
    CHECK (curd_unit_price_paise >= 0);

CREATE TABLE IF NOT EXISTS native_product_catalog (
  product_key text PRIMARY KEY CHECK (product_key IN ('milk', 'curd')),
  unit_price_paise integer NOT NULL DEFAULT 0 CHECK (unit_price_paise >= 0),
  pack_label text NOT NULL DEFAULT '',
  enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO native_product_catalog (product_key, unit_price_paise, pack_label, enabled)
VALUES ('milk', 0, '', false), ('curd', 0, '', false)
ON CONFLICT (product_key) DO NOTHING;
