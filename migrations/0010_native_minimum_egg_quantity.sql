-- Require at least 10 eggs on every native order.
-- NOT VALID preserves any historical rows while enforcing this rule for new writes.
ALTER TABLE "native_orders"
  ADD CONSTRAINT "native_orders_minimum_egg_quantity_check"
  CHECK ("quantity" >= 10) NOT VALID;
