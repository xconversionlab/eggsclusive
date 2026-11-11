-- Native customer authentication and shared order/status timeline.
-- Runs on Neon in deployed Vercel environments and PGLite in workspace preview.

create table if not exists "native_customers" (
  "id" text primary key,
  "phone" text not null unique,
  "name" text not null default '',
  "verified_at" timestamptz not null default now(),
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);
create index if not exists "native_customers_phone_idx" on "native_customers" ("phone");

create table if not exists "native_otp_challenges" (
  "id" text primary key,
  "phone" text not null,
  "otp_hash" text not null,
  "expires_at" timestamptz not null,
  "attempts" integer not null default 0 check ("attempts" >= 0 and "attempts" <= 5),
  "consumed_at" timestamptz,
  "created_at" timestamptz not null default now()
);
create index if not exists "native_otp_phone_created_idx"
  on "native_otp_challenges" ("phone", "created_at" desc);

create table if not exists "native_customer_sessions" (
  "token_hash" text primary key,
  "customer_id" text not null references "native_customers" ("id") on delete cascade,
  "expires_at" timestamptz not null,
  "revoked_at" timestamptz,
  "created_at" timestamptz not null default now(),
  "last_seen_at" timestamptz not null default now()
);
create index if not exists "native_customer_sessions_customer_idx"
  on "native_customer_sessions" ("customer_id", "expires_at" desc);

create table if not exists "native_orders" (
  "id" text primary key,
  "customer_id" text not null references "native_customers" ("id") on delete restrict,
  "customer_phone" text not null,
  "customer_name" text not null,
  "quantity" integer not null check ("quantity" > 0 and "quantity" <= 360),
  "unit_price_paise" integer not null check ("unit_price_paise" > 0),
  "total_paise" integer not null check ("total_paise" > 0),
  "payment_method" text not null,
  "status" text not null default 'placed'
    check ("status" in ('placed', 'accepted', 'preparing', 'out_for_delivery', 'delivered', 'cancelled')),
  "partner_shop" text not null,
  "partner_name" text not null,
  "partner_phone" text not null,
  "delivery_otp_encrypted" text not null,
  "address_label" text not null default 'Home',
  "address_line" text not null,
  "city" text not null,
  "pincode" text not null,
  "latitude" double precision,
  "longitude" double precision,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  "status_changed_at" timestamptz not null default now()
);
create index if not exists "native_orders_customer_created_idx"
  on "native_orders" ("customer_id", "created_at" desc);
create index if not exists "native_orders_status_idx"
  on "native_orders" ("status", "created_at" desc);

create table if not exists "native_order_events" (
  "id" text primary key,
  "order_id" text not null references "native_orders" ("id") on delete cascade,
  "from_status" text,
  "to_status" text not null,
  "note" text not null default '',
  "actor" text not null default 'system',
  "created_at" timestamptz not null default now()
);
create index if not exists "native_order_events_order_idx"
  on "native_order_events" ("order_id", "created_at" asc);

create table if not exists "native_sms_outbox" (
  "id" text primary key,
  "order_id" text references "native_orders" ("id") on delete cascade,
  "recipient" text not null,
  "template_kind" text not null check ("template_kind" in ('otp', 'order_status')),
  "template_vars" jsonb not null default '{}'::jsonb,
  "provider_message_id" text,
  "status" text not null default 'queued'
    check ("status" in ('queued', 'submitted', 'delivered', 'failed', 'not_configured')),
  "error" text,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);
create index if not exists "native_sms_outbox_status_idx"
  on "native_sms_outbox" ("status", "created_at");
