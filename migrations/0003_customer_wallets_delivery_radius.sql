-- Spencers Enterprices: customer wallet and vendor delivery-radius foundation.
-- The current preview wallet is browser-local; these tables provide the durable,
-- authenticated server-side ledger required before live wallet payments launch.

alter table "vendors"
  add column if not exists "delivery_radius_km" numeric(5,2) not null default 5.00
  check ("delivery_radius_km" > 0 and "delivery_radius_km" <= 50);

create table if not exists "customer_wallets" (
  "customer_user_id" text primary key references "user" ("id") on delete cascade,
  "balance_paise" bigint not null default 0 check ("balance_paise" >= 0),
  "currency" char(3) not null default 'INR',
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

create table if not exists "customer_wallet_transactions" (
  "id" text primary key,
  "customer_user_id" text not null references "user" ("id") on delete cascade,
  "order_id" text references "orders" ("id") on delete set null,
  "direction" text not null check ("direction" in ('credit', 'debit')),
  "amount_paise" bigint not null check ("amount_paise" > 0),
  "balance_after_paise" bigint not null check ("balance_after_paise" >= 0),
  "reason" text not null,
  "idempotency_key" text unique,
  "created_at" timestamptz not null default now()
);
create index if not exists "customer_wallet_transactions_customer_idx"
  on "customer_wallet_transactions" ("customer_user_id", "created_at" desc);

create table if not exists "customer_addresses" (
  "id" text primary key,
  "customer_user_id" text not null references "user" ("id") on delete cascade,
  "label" text not null default 'Home',
  "city" text not null default 'Chennai',
  "locality_id" text not null references "localities" ("id") on delete restrict,
  "street_id" text not null references "streets" ("id") on delete restrict,
  "address_line" text not null default '',
  "door" text not null,
  "apartment" text not null default '',
  "landmark" text not null default '',
  "pin" text not null,
  "is_default" boolean not null default false,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);
create index if not exists "customer_addresses_user_idx"
  on "customer_addresses" ("customer_user_id", "is_default");
