-- Simify Asset Library — Supabase setup.
-- Run this ONCE in your Supabase project: SQL Editor → New query → paste → Run.
-- (Also create a PUBLIC Storage bucket named "assets" — see web/README.md.)

create extension if not exists "pgcrypto";

create table if not exists public.assets (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  type         text not null check (type in ('icon', 'graphic', 'image')),
  tags         text[] not null default '{}',
  file_url     text not null,
  format       text not null,
  width        int,
  height       int,
  uploaded_by  text not null default 'team',
  created_at   timestamptz not null default now(),
  source       text not null default 'uploaded' check (source in ('uploaded', 'generated')),
  status       text not null default 'published' check (status in ('published', 'needs-review')),
  parent_id    uuid references public.assets(id) on delete set null
);

create index if not exists assets_created_idx on public.assets (created_at desc);
create index if not exists assets_type_idx on public.assets (type);

-- Lock the table down. The website only ever talks to Supabase from the server
-- using the service-role key (which bypasses RLS), and the whole site sits behind
-- the shared password. With RLS on and no policies, nothing else can read/write.
alter table public.assets enable row level security;

-- Seed the 6 starter icons. Their files are served statically from the app's
-- /public/assets folder, so file_url is a relative path (no storage object).
-- Safe to skip/delete later. Run only once (re-running adds duplicates).
insert into public.assets (name, type, tags, file_url, format, width, height, uploaded_by, source, status) values
  ('Globe',              'icon', '{travel,coverage,global}',   '/assets/globe.svg',              'svg', 48, 48, 'seed', 'uploaded', 'published'),
  ('SIM Card',           'icon', '{esim,product,sim}',         '/assets/sim-card.svg',           'svg', 48, 48, 'seed', 'uploaded', 'published'),
  ('Signal / WiFi',      'icon', '{connectivity,data,signal}', '/assets/signal-wifi.svg',        'svg', 48, 48, 'seed', 'uploaded', 'published'),
  ('Plane',              'icon', '{travel,flight}',            '/assets/plane.svg',              'svg', 48, 48, 'seed', 'uploaded', 'published'),
  ('Phone',              'icon', '{device,mobile}',            '/assets/phone.svg',              'svg', 48, 48, 'seed', 'uploaded', 'published'),
  ('Secure Connection',  'icon', '{security,trust}',           '/assets/secure-connection.svg',  'svg', 48, 48, 'seed', 'uploaded', 'published');
