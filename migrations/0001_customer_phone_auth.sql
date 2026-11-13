-- Customer phone OTP authentication for Spencer's Enterprises.
-- OTP challenges and customer sessions are server-only; browser receives an HttpOnly session cookie.

create table if not exists native_customers (
  id text primary key,
  phone text not null unique,
  name text not null,
  verified_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists native_customers_phone_idx on native_customers (phone);

create table if not exists native_otp_challenges (
  id text primary key,
  phone text not null,
  requester_hash text not null,
  otp_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0 check (attempts >= 0 and attempts <= 5),
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists native_otp_phone_created_idx
  on native_otp_challenges (phone, created_at desc);
create index if not exists native_otp_requester_created_idx
  on native_otp_challenges (requester_hash, created_at desc);

create table if not exists native_customer_sessions (
  token_hash text primary key,
  customer_id text not null references native_customers (id) on delete cascade,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
create index if not exists native_customer_sessions_customer_idx
  on native_customer_sessions (customer_id, expires_at desc);
