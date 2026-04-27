-- 035_spot_images_path_first_metadata.sql
--
-- V1 media canon foundation.
-- Additive/non-destructive:
-- - keeps legacy public URL column (`url`);
-- - adds path-first Storage fields for future CDN/transforms/thumbnails;
-- - backfills storage_path from existing Supabase public URLs;
-- - does not delete objects or change RLS.

begin;

alter table public.spot_images
  add column if not exists storage_bucket text,
  add column if not exists storage_path text,
  add column if not exists width integer,
  add column if not exists height integer,
  add column if not exists blurhash text,
  add column if not exists thumb_path text,
  add column if not exists version integer not null default 1,
  add column if not exists updated_at timestamptz not null default now();

comment on column public.spot_images.url is
  'Legacy public URL. Keep until all consumers use storage_bucket/storage_path.';
comment on column public.spot_images.storage_bucket is
  'Storage bucket for path-first media resolution. V1 public gallery defaults to spot-covers.';
comment on column public.spot_images.storage_path is
  'Object path inside storage_bucket, e.g. {spotId}/gallery/{uuid}.jpg.';
comment on column public.spot_images.thumb_path is
  'Optional thumbnail object path; null until transforms are introduced.';
comment on column public.spot_images.version is
  'Media version for future cache busting/CDN invalidation.';

update public.spot_images
set
  storage_bucket = coalesce(storage_bucket, 'spot-covers'),
  storage_path = coalesce(
    storage_path,
    regexp_replace(
      split_part(url, '?', 1),
      '^https?://[^/]+/storage/v1/object/public/spot-covers/',
      ''
    )
  ),
  updated_at = now()
where
  url is not null
  and trim(url) <> ''
  and split_part(url, '?', 1) ~ '^https?://[^/]+/storage/v1/object/public/spot-covers/'
  and (storage_path is null or storage_bucket is null);

create index if not exists idx_spot_images_spot_sort_order
  on public.spot_images(spot_id, sort_order, created_at);

create index if not exists idx_spot_images_storage_object
  on public.spot_images(storage_bucket, storage_path)
  where storage_bucket is not null and storage_path is not null;

commit;
