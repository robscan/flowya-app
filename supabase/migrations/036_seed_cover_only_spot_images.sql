-- 036_seed_cover_only_spot_images.sql
--
-- V1 media canon cleanup.
-- Additive/idempotent:
-- - creates spot_images rows for legacy cover-only public images;
-- - only seeds spots with cover_image_url but no existing gallery rows;
-- - keeps spots.cover_image_url unchanged;
-- - does not delete Storage objects or alter RLS.
--
-- Manual rollback, if needed after review:
-- delete from public.spot_images si
-- using public.spot_images_cover_seed_036_backup b
-- where si.id = b.inserted_image_id;

begin;

create table if not exists public.spot_images_cover_seed_036_backup (
  spot_id uuid primary key references public.spots(id) on delete cascade,
  inserted_image_id uuid not null unique,
  cover_image_url text not null,
  storage_path text not null,
  seeded_at timestamptz not null default now()
);

alter table public.spot_images_cover_seed_036_backup enable row level security;

with candidates as (
  select
    s.id as spot_id,
    gen_random_uuid() as image_id,
    split_part(s.cover_image_url, '?', 1) as cover_url,
    regexp_replace(
      split_part(s.cover_image_url, '?', 1),
      '^https?://[^/]+/storage/v1/object/public/spot-covers/',
      ''
    ) as storage_path
  from public.spots s
  where
    s.cover_image_url is not null
    and trim(s.cover_image_url) <> ''
    and split_part(s.cover_image_url, '?', 1) ~ '^https?://[^/]+/storage/v1/object/public/spot-covers/'
    and not exists (
      select 1
      from public.spot_images si
      where si.spot_id = s.id
    )
    and not exists (
      select 1
      from public.spot_images_cover_seed_036_backup b
      where b.spot_id = s.id
    )
),
inserted as (
  insert into public.spot_images (
    id,
    spot_id,
    url,
    storage_bucket,
    storage_path,
    sort_order
  )
  select
    image_id,
    spot_id,
    cover_url,
    'spot-covers',
    storage_path,
    0
  from candidates
  returning id, spot_id, url, storage_path
)
insert into public.spot_images_cover_seed_036_backup (
  spot_id,
  inserted_image_id,
  cover_image_url,
  storage_path
)
select
  spot_id,
  id,
  url,
  storage_path
from inserted
on conflict (spot_id) do nothing;

commit;
