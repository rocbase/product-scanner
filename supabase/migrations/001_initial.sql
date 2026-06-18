-- Product Scanner schema (optional Supabase backend)

create table if not exists scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending',
  photos jsonb not null default '[]',
  ai_result jsonb,
  user_edits jsonb,
  cost_cents integer,
  notes text,
  bookmarked boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists price_results (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references scans(id) on delete cascade,
  marketplace text not null,
  title text not null,
  price_cents integer not null,
  currency text not null default 'USD',
  condition text,
  url text not null,
  image_url text,
  fetched_at timestamptz not null default now()
);

create table if not exists listings (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references scans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null,
  price_cents integer not null,
  condition text not null,
  category text,
  photo_order jsonb not null default '[]',
  ai_draft jsonb,
  user_edits jsonb,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists marketplace_posts (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  marketplace text not null,
  status text not null default 'pending',
  external_listing_id text,
  external_url text,
  error_message text,
  posted_at timestamptz
);

create table if not exists marketplace_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  marketplace text not null,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  seller_username text,
  connected_at timestamptz not null default now(),
  unique (user_id, marketplace)
);

alter table scans enable row level security;
alter table price_results enable row level security;
alter table listings enable row level security;
alter table marketplace_posts enable row level security;
alter table marketplace_accounts enable row level security;

create policy "Users manage own scans" on scans
  for all using (auth.uid() = user_id);

create policy "Users manage own price results" on price_results
  for all using (
    scan_id in (select id from scans where user_id = auth.uid())
  );

create policy "Users manage own listings" on listings
  for all using (auth.uid() = user_id);

create policy "Users manage own posts" on marketplace_posts
  for all using (
    listing_id in (select id from listings where user_id = auth.uid())
  );

create policy "Users manage own marketplace accounts" on marketplace_accounts
  for all using (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('scan-photos', 'scan-photos', true)
on conflict (id) do nothing;