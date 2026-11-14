-- Add Water Can as an optional add-on quantity while Fresh Egg remains the primary order item.
ALTER TABLE native_orders
  ADD COLUMN IF NOT EXISTS water_can_quantity integer NOT NULL DEFAULT 0
  CHECK (water_can_quantity >= 0 AND water_can_quantity <= 30);
