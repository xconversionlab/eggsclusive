-- Preserve the customer's exact Rapido-style map pin with saved addresses and orders.
alter table "customer_addresses"
  add column if not exists "latitude" double precision,
  add column if not exists "longitude" double precision;

alter table "orders"
  add column if not exists "address_line" text not null default '',
  add column if not exists "delivery_latitude" double precision,
  add column if not exists "delivery_longitude" double precision;
