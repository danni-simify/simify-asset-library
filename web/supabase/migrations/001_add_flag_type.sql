-- Adds the "flag" asset type. Run ONCE in Supabase: SQL Editor → New query → paste → Run.
-- (Needed because the original table only allowed icon | graphic | image.)

alter table public.assets drop constraint if exists assets_type_check;
alter table public.assets
  add constraint assets_type_check
  check (type in ('icon', 'graphic', 'image', 'flag'));
