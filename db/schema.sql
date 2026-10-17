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

-- ── Website CMS (content for the public Pegasus site) ─────────────────────────

create table if not exists site_content (
  key          text primary key,                 -- e.g. 'home.hero', see lib/site/schema.ts
  draft        jsonb,                            -- unpublished edits; null when none
  published    jsonb,                            -- live content; null = site uses built-in defaults
  updated_at   timestamptz,
  updated_by   text,
  published_at timestamptz,
  published_by text
);

create table if not exists site_content_versions (
  id           bigint generated always as identity primary key,
  key          text not null,
  data         jsonb not null,
  published_at timestamptz not null default now(),
  published_by text
);
create index if not exists site_content_versions_key on site_content_versions (key, published_at desc);

create table if not exists media (
  id           text primary key default gen_random_uuid()::text,
  filename     text not null,
  content_type text not null,
  size         integer not null,
  data         bytea not null,
  created_at   timestamptz not null default now(),
  uploaded_by  text
);

-- Brochure requests and dealer/business enquiries submitted on the public site.
create table if not exists leads (
  id                bigint generated always as identity primary key,
  kind              text not null check (kind in ('brochure', 'dealer', 'business')),
  name              text not null default '',
  email             text not null,
  company           text not null default '',
  country           text not null default '',
  role              text not null default '',
  interest          text not null default '',
  message           text not null default '',
  marketing_consent boolean not null default false,
  status            text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  notes             text not null default '',
  created_at        timestamptz not null default now()
);
create index if not exists leads_created_at on leads (created_at desc);

create table if not exists audit_log (
  id          bigint generated always as identity primary key,
  actor_id    text,
  actor_email text,
  action      text not null,                     -- e.g. 'site.publish', 'media.delete'
  target      text,
  details     jsonb,
  at          timestamptz not null default now()
);
create index if not exists audit_log_at on audit_log (at desc);

-- ── Admin features (staff roles, account control, CRM, courses) ──────────────

alter table users add column if not exists admin_role text check (admin_role in ('owner', 'editor', 'support'));
alter table users add column if not exists suspended_at timestamptz;
alter table users add column if not exists last_seen_at timestamptz;
alter table users add column if not exists session_version integer not null default 0; -- bump = sign out everywhere
alter table users add column if not exists must_change_password boolean not null default false;
alter table users add column if not exists phone text not null default '';
alter table users add column if not exists country text not null default '';
update users set admin_role = 'owner' where role = 'admin' and admin_role is null;

alter table product_keys add column if not exists batch text not null default '';
alter table product_keys add column if not exists voided_at timestamptz;

alter table progress add column if not exists updated_at timestamptz not null default now();

-- Certificates can be revoked and reissued: only one *active* certificate per user + product.
alter table certificates add column if not exists revoked_at timestamptz;
alter table certificates add column if not exists revoked_reason text;
alter table certificates add column if not exists revoked_by text;
alter table certificates drop constraint if exists certificates_user_id_product_slug_key;
create unique index if not exists certificates_one_active on certificates (user_id, product_slug) where revoked_at is null;

create table if not exists customer_notes (
  id         bigint generated always as identity primary key,
  user_id    text not null references users(id) on delete cascade,
  author     text not null,
  body       text not null,
  created_at timestamptz not null default now()
);
create index if not exists customer_notes_user on customer_notes (user_id, created_at desc);

-- Course catalogue, editable in the admin. Seeded from lib/catalog.ts on first use.
create table if not exists courses (
  slug       text primary key,
  data       jsonb not null,                   -- name, line, image, description, lessons[] …
  position   integer not null default 0,
  updated_at timestamptz not null default now(),
  updated_by text
);

-- Supabase exposes the public schema over its REST API. The app connects directly as the
-- database owner (which bypasses RLS), so enabling RLS with no policies locks the API out.
alter table users        enable row level security;
alter table product_keys enable row level security;
alter table progress     enable row level security;
alter table certificates enable row level security;
alter table site_content          enable row level security;
alter table site_content_versions enable row level security;
alter table media                 enable row level security;
alter table leads                 enable row level security;
alter table audit_log             enable row level security;
alter table customer_notes        enable row level security;
alter table courses               enable row level security;
