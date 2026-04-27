-- 034_spots_invalid_mapbox_bbox_cleanup.sql
--
-- V1 P0 map stability cleanup.
-- Non-destructive data cleanup for derived Mapbox camera metadata:
-- - backs up current invalid bbox rows before changing them;
-- - clears only mapbox_bbox/mapbox_feature_type when bbox is malformed or does not contain the spot point;
-- - never changes spot coordinates, pins, visibility, ownership, or user content.
--
-- Manual rollback, if needed after review:
-- update public.spots s
-- set
--   mapbox_bbox = b.old_mapbox_bbox,
--   mapbox_feature_type = b.old_mapbox_feature_type,
--   updated_at = now()
-- from public.spots_mapbox_bbox_cleanup_034_backup b
-- where b.spot_id = s.id;

begin;

create table if not exists public.spots_mapbox_bbox_cleanup_034_backup (
  spot_id uuid primary key references public.spots(id) on delete cascade,
  old_mapbox_bbox jsonb,
  old_mapbox_feature_type text,
  cleaned_at timestamptz not null default now(),
  reason text not null
);

alter table public.spots_mapbox_bbox_cleanup_034_backup enable row level security;

with shaped as (
  select
    s.id,
    s.mapbox_bbox,
    s.mapbox_feature_type,
    s.latitude,
    s.longitude,
    (
      jsonb_typeof(s.mapbox_bbox) = 'object'
      and s.mapbox_bbox ? 'west'
      and s.mapbox_bbox ? 'east'
      and s.mapbox_bbox ? 'south'
      and s.mapbox_bbox ? 'north'
      and jsonb_typeof(s.mapbox_bbox->'west') = 'number'
      and jsonb_typeof(s.mapbox_bbox->'east') = 'number'
      and jsonb_typeof(s.mapbox_bbox->'south') = 'number'
      and jsonb_typeof(s.mapbox_bbox->'north') = 'number'
    ) as has_numeric_bbox
  from public.spots s
  where s.mapbox_bbox is not null
),
bbox_values as (
  select
    shaped.*,
    case when has_numeric_bbox then (mapbox_bbox->>'west')::double precision end as west,
    case when has_numeric_bbox then (mapbox_bbox->>'east')::double precision end as east,
    case when has_numeric_bbox then (mapbox_bbox->>'south')::double precision end as south,
    case when has_numeric_bbox then (mapbox_bbox->>'north')::double precision end as north
  from shaped
),
invalid_bbox as (
  select
    id,
    mapbox_bbox,
    mapbox_feature_type,
    case
      when not has_numeric_bbox then 'malformed_bbox'
      when west < -180 or east > 180 or south < -90 or north > 90 then 'bbox_out_of_world_bounds'
      when west >= east or south >= north then 'bbox_inverted_or_empty'
      when longitude < west or longitude > east or latitude < south or latitude > north then 'bbox_does_not_contain_spot_point'
      else 'unknown'
    end as reason
  from bbox_values
  where
    not has_numeric_bbox
    or west < -180
    or east > 180
    or south < -90
    or north > 90
    or west >= east
    or south >= north
    or longitude < west
    or longitude > east
    or latitude < south
    or latitude > north
)
insert into public.spots_mapbox_bbox_cleanup_034_backup (
  spot_id,
  old_mapbox_bbox,
  old_mapbox_feature_type,
  reason
)
select
  id,
  mapbox_bbox,
  mapbox_feature_type,
  reason
from invalid_bbox
on conflict (spot_id) do nothing;

with shaped as (
  select
    s.id,
    s.mapbox_bbox,
    s.latitude,
    s.longitude,
    (
      jsonb_typeof(s.mapbox_bbox) = 'object'
      and s.mapbox_bbox ? 'west'
      and s.mapbox_bbox ? 'east'
      and s.mapbox_bbox ? 'south'
      and s.mapbox_bbox ? 'north'
      and jsonb_typeof(s.mapbox_bbox->'west') = 'number'
      and jsonb_typeof(s.mapbox_bbox->'east') = 'number'
      and jsonb_typeof(s.mapbox_bbox->'south') = 'number'
      and jsonb_typeof(s.mapbox_bbox->'north') = 'number'
    ) as has_numeric_bbox
  from public.spots s
  where s.mapbox_bbox is not null
),
bbox_values as (
  select
    shaped.*,
    case when has_numeric_bbox then (mapbox_bbox->>'west')::double precision end as west,
    case when has_numeric_bbox then (mapbox_bbox->>'east')::double precision end as east,
    case when has_numeric_bbox then (mapbox_bbox->>'south')::double precision end as south,
    case when has_numeric_bbox then (mapbox_bbox->>'north')::double precision end as north
  from shaped
),
invalid_bbox as (
  select id
  from bbox_values
  where
    not has_numeric_bbox
    or west < -180
    or east > 180
    or south < -90
    or north > 90
    or west >= east
    or south >= north
    or longitude < west
    or longitude > east
    or latitude < south
    or latitude > north
)
update public.spots s
set
  mapbox_bbox = null,
  mapbox_feature_type = null,
  updated_at = now()
from invalid_bbox
where s.id = invalid_bbox.id;

commit;
