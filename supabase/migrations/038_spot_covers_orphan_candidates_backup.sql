-- 038_spot_covers_orphan_candidates_backup.sql
--
-- Prepares cleanup of spot-covers objects that are not referenced by:
-- - public.spot_images.storage_path
-- - public.spot_images.url
-- - public.spots.cover_image_url
--
-- Important:
-- - Supabase blocks direct deletion from storage.objects.
-- - This migration only backs up candidate metadata.
-- - Actual deletion must use the Storage API.
-- - Local helper: scripts/supabase/delete-spot-covers-orphans.mjs

create table if not exists public.spot_covers_orphan_delete_038_backup (
  object_id text primary key,
  bucket_id text not null,
  name text not null,
  storage_object_snapshot jsonb not null,
  created_at timestamptz,
  updated_at timestamptz,
  deleted_at timestamptz not null default now()
);

alter table public.spot_covers_orphan_delete_038_backup enable row level security;

with referenced_paths as (
  select trim(storage_path) as path
  from public.spot_images
  where storage_bucket = 'spot-covers'
    and storage_path is not null
    and trim(storage_path) <> ''

  union

  select regexp_replace(
    split_part(url, '?', 1),
    '^https?://[^/]+/storage/v1/object/public/spot-covers/',
    ''
  ) as path
  from public.spot_images
  where url is not null
    and split_part(url, '?', 1) ~ '^https?://[^/]+/storage/v1/object/public/spot-covers/'

  union

  select regexp_replace(
    split_part(cover_image_url, '?', 1),
    '^https?://[^/]+/storage/v1/object/public/spot-covers/',
    ''
  ) as path
  from public.spots
  where cover_image_url is not null
    and split_part(cover_image_url, '?', 1) ~ '^https?://[^/]+/storage/v1/object/public/spot-covers/'
),
orphan_candidates as (
  select o.*
  from storage.objects o
  where o.bucket_id = 'spot-covers'
    and not exists (
      select 1
      from referenced_paths r
      where r.path = o.name
    )
)
insert into public.spot_covers_orphan_delete_038_backup (
  object_id,
  bucket_id,
  name,
  storage_object_snapshot,
  created_at,
  updated_at
)
select
  o.id::text,
  o.bucket_id,
  o.name,
  to_jsonb(o),
  o.created_at,
  o.updated_at
from orphan_candidates o
on conflict (object_id) do nothing;
