-- Pegasus Academy schema. Idempotent: safe to re-run (scripts/setup-db.mjs applies it).

create table if not exists users (
  id            text primary key default gen_random_uuid()::text,
  name          text not null,
  email         text not null unique,            -- stored lowercase
  salon         text not null default '',
  role          text not null default 'customer' check (role in ('customer', 'admin')),
  entitlements  text[] not null default '{}',    -- product slugs unlocked by redeemed keys
  password_hash text not null,
  created_at    timestamptz not null default now()
);

create table if not exists product_keys (
  code          text primary key check (code ~ '^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$'),
  product_slug  text not null,
  added_at      timestamptz not null default now(),
  used_by       text references users(id) on delete set null,
  used_by_email text,
  used_at       timestamptz
);

create table if not exists progress (
  user_id      text not null references users(id) on delete cascade,
  product_slug text not null,
  lessons      text[] not null default '{}',     -- completed lesson ids
  primary key (user_id, product_slug)
);

create table if not exists certificates (
  id           text primary key,                 -- PGS-XXXXXXXX-XXXXXXXX
  user_id      text not null references users(id) on delete cascade,
  user_name    text not null,
  salon        text not null default '',
  product_slug text not null,
  product_name text not null,
  issued_at    timestamptz not null default now(),
  unique (user_id, product_slug)
);

create index if not exists product_keys_added_at on product_keys (added_at desc);

-- Supabase exposes the public schema over its REST API. The app connects directly as the
-- database owner (which bypasses RLS), so enabling RLS with no policies locks the API out.
alter table users        enable row level security;
alter table product_keys enable row level security;
alter table progress     enable row level security;
alter table certificates enable row level security;
