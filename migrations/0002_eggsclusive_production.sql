-- EGGSCLUSIVE Production Schema: Hyperlocal Egg Ecosystem in Chennai, Tamil Nadu

-- 1. Localities
create table if not exists "localities" (
  "id" text not null primary key,
  "name_en" text not null,
  "name_ta" text not null,
  "pin" text not null,
  "lat" double precision not null,
  "lng" double precision not null,
  "created_at" timestamptz not null default now()
);

-- 2. Streets
create table if not exists "streets" (
  "id" text not null primary key,
  "locality_id" text not null references "localities" ("id") on delete cascade,
  "name_en" text not null,
  "name_ta" text not null,
  "aliases" jsonb not null default '[]'::jsonb,
  "pin" text not null,
  "lat" double precision not null,
  "lng" double precision not null,
  "status" text not null default 'active', -- active, suspended, inactive
  "created_at" timestamptz not null default now()
);
create index if not exists "streets_locality_id_idx" on "streets" ("locality_id");
create index if not exists "streets_status_idx" on "streets" ("status");

-- 3. Vendors
create table if not exists "vendors" (
  "id" text not null primary key,
  "name_en" text not null,
  "name_ta" text not null,
  "phone" text not null,
  "status" text not null default 'pending', -- pending, approved, suspended
  "locality_id" text not null references "localities" ("id") on delete restrict,
  "lat" double precision not null,
  "lng" double precision not null,
  "hours_open" text not null default '06:00',
  "hours_close" text not null default '21:30',
  "rating" numeric(3, 2) not null default 4.80,
  "review_count" integer not null default 0,
  "commission_bps" integer not null default 700, -- 7.00%
  "accepting_orders" boolean not null default true,
  "rider_en" text not null default 'Kumar',
  "rider_ta" text not null default 'குமார்',
  "pin" text not null,
  "created_at" timestamptz not null default now()
);
create index if not exists "vendors_locality_id_idx" on "vendors" ("locality_id");
create index if not exists "vendors_status_idx" on "vendors" ("status");

-- 4. Vendor Street Assignments (Routing Matrix)
create table if not exists "vendor_street_assignments" (
  "vendor_id" text not null references "vendors" ("id") on delete cascade,
  "street_id" text not null references "streets" ("id") on delete cascade,
  "role" text not null default 'primary', -- primary, backup
  "priority" integer not null default 1,
  "created_at" timestamptz not null default now(),
  primary key ("vendor_id", "street_id")
);
create index if not exists "vsa_street_idx" on "vendor_street_assignments" ("street_id");

-- 5. Products Master Catalogue
create table if not exists "products" (
  "id" text not null primary key,
  "name_en" text not null,
  "name_ta" text not null,
  "blurb_en" text not null,
  "blurb_ta" text not null,
  "category" text not null default 'table', -- table, country, specialty, bulk
  "packs" jsonb not null default '[6, 12, 30]'::jsonb,
  "active" boolean not null default true,
  "created_at" timestamptz not null default now()
);

-- 6. Vendor Product Inventory & Pricing
create table if not exists "vendor_products" (
  "vendor_id" text not null references "vendors" ("id") on delete cascade,
  "product_id" text not null references "products" ("id") on delete cascade,
  "price_per_egg_paise" integer not null default 650, -- e.g. 650 paise = Rs 6.50
  "stock_eggs" integer not null default 100,
  "low_stock_at" integer not null default 30,
  "active" boolean not null default true,
  "batch_en" text,
  "batch_ta" text,
  "updated_at" timestamptz not null default now(),
  primary key ("vendor_id", "product_id")
);
create index if not exists "vp_product_idx" on "vendor_products" ("product_id");

-- 7. Delivery Slots
create table if not exists "delivery_slots" (
  "id" text not null primary key,
  "label_en" text not null,
  "label_ta" text not null,
  "start_time" text not null,
  "end_time" text not null,
  "early" boolean not null default false
);

-- 8. Delivery Slot Capacities
create table if not exists "delivery_capacities" (
  "vendor_id" text not null references "vendors" ("id") on delete cascade,
  "slot_id" text not null references "delivery_slots" ("id") on delete cascade,
  "date" text not null, -- YYYY-MM-DD
  "capacity" integer not null default 25,
  "booked" integer not null default 0,
  primary key ("vendor_id", "slot_id", "date")
);

-- 9. Orders
create table if not exists "orders" (
  "id" text not null primary key,
  "customer_user_id" text default 'self',
  "customer_name" text not null,
  "phone" text not null,
  "account_type" text not null default 'home', -- home, restaurant, bakery, hotel, tea
  "business_name" text not null default '',
  "street_id" text not null references "streets" ("id") on delete restrict,
  "door" text not null,
  "apartment" text not null default '',
  "landmark" text not null default '',
  "pin" text not null,
  "vendor_id" text not null references "vendors" ("id") on delete restrict,
  "slot_id" text not null references "delivery_slots" ("id") on delete restrict,
  "delivery_date" text not null, -- YYYY-MM-DD
  "method" text not null default 'cod', -- cod, upi, wallet
  "captured_paise" integer not null default 0,
  "total_paise" integer not null default 0,
  "discount_paise" integer not null default 0,
  "status" text not null default 'placed', -- placed, accepted, preparing, out_for_delivery, delivered, rejected, cancelled
  "coupon_code" text,
  "subscription_id" text,
  "rating" integer,
  "settled" boolean not null default false,
  "cash_pending" boolean not null default false,
  "cancel_requested" boolean not null default false,
  "created_at" timestamptz not null default now()
);
create index if not exists "orders_vendor_id_idx" on "orders" ("vendor_id");
create index if not exists "orders_status_idx" on "orders" ("status");
create index if not exists "orders_created_at_idx" on "orders" ("created_at");

-- 10. Order Lines
create table if not exists "order_items" (
  "id" text not null primary key,
  "order_id" text not null references "orders" ("id") on delete cascade,
  "product_id" text not null references "products" ("id") on delete restrict,
  "pack" integer not null,
  "qty_packs" integer not null,
  "price_per_egg_paise" integer not null
);
create index if not exists "order_items_order_id_idx" on "order_items" ("order_id");

-- 11. Order Events / Audit Trail
create table if not exists "order_events" (
  "id" text not null primary key,
  "order_id" text not null references "orders" ("id") on delete cascade,
  "at" timestamptz not null default now(),
  "text_en" text not null,
  "text_ta" text not null
);
create index if not exists "order_events_order_id_idx" on "order_events" ("order_id");

-- 12. Subscriptions
create table if not exists "subscriptions" (
  "id" text not null primary key,
  "customer_user_id" text not null default 'self',
  "product_id" text not null references "products" ("id") on delete restrict,
  "pack" integer not null,
  "qty_packs" integer not null,
  "cadence" text not null default 'daily', -- daily, weekly
  "slot_id" text not null references "delivery_slots" ("id") on delete restrict,
  "status" text not null default 'active', -- active, paused
  "skip_dates" jsonb not null default '[]'::jsonb,
  "vendor_id" text not null references "vendors" ("id") on delete restrict,
  "address" jsonb not null,
  "next_date" text not null,
  "price_per_egg_paise" integer not null,
  "created_at" timestamptz not null default now()
);

-- 13. Complaints (Broken Eggs / Replacements / Quality)
create table if not exists "complaints" (
  "id" text not null primary key,
  "order_id" text not null references "orders" ("id") on delete cascade,
  "customer_user_id" text not null default 'self',
  "kind" text not null default 'broken', -- broken, refund, replacement, support
  "note" text not null,
  "status" text not null default 'open', -- open, replacement, refunded, closed
  "created_at" timestamptz not null default now()
);

-- 14. Settlements (Vendor Payouts & Commission Reconciliation)
create table if not exists "settlements" (
  "id" text not null primary key,
  "vendor_id" text not null references "vendors" ("id") on delete cascade,
  "label" text not null,
  "gross_paise" integer not null,
  "commission_paise" integer not null,
  "net_paise" integer not null,
  "status" text not null default 'pending', -- paid, pending
  "at" timestamptz not null default now()
);

-- 15. Operational Audit Log
create table if not exists "audit_logs" (
  "id" text not null primary key,
  "actor" text not null,
  "action" text not null,
  "detail" text not null,
  "at" timestamptz not null default now()
);

-- 16. Platform Broadcast Notices
create table if not exists "notices" (
  "id" text not null primary key,
  "title_en" text not null,
  "title_ta" text not null,
  "body_en" text not null,
  "body_ta" text not null,
  "read" boolean not null default false,
  "at" timestamptz not null default now()
);

-- 17. Coupons
create table if not exists "coupons" (
  "code" text not null primary key,
  "kind" text not null default 'percent',
  "value" integer not null,
  "cap_paise" integer,
  "rule" text not null default 'first',
  "label_en" text not null,
  "label_ta" text not null,
  "active" boolean not null default true
);
