-- 039_spots_linked_exact_duplicate_cleanup.sql
--
-- Non-destructive cleanup for exact duplicate linked spots created by concurrent POI persists.
--
-- Scope:
-- - visible spots only;
-- - link_status='linked';
-- - linked_place_id present;
-- - same normalized title;
-- - same coordinates rounded to 7 decimals.
--
-- This intentionally does NOT dedupe all repeated linked_place_id values. Some historical rows
-- share provider ids but differ semantically (for example localized names or country/city ambiguity)
-- and need separate product review.
--
-- Rollback sketch:
-- - drop index public.spots_visible_linked_exact_unique_039;
-- - use public.spots_linked_exact_dedupe_039_backup to restore hidden duplicate spot snapshots;
-- - rehydrate moved/deleted pins, pin_tags, spot_images and spot_personal_images from snapshots if needed.

create table if not exists public.spots_linked_exact_dedupe_039_backup (
  duplicate_spot_id uuid primary key,
  canonical_spot_id uuid not null,
  group_key text not null,
  spot_snapshot jsonb not null,
  pins_snapshot jsonb not null default '[]'::jsonb,
  pin_tags_snapshot jsonb not null default '[]'::jsonb,
  spot_images_snapshot jsonb not null default '[]'::jsonb,
  spot_personal_images_snapshot jsonb not null default '[]'::jsonb,
  backed_up_at timestamptz not null default now()
);

alter table public.spots_linked_exact_dedupe_039_backup enable row level security;

create temp table tmp_spots_linked_exact_dedupe_039 on commit drop as
with visible_linked as (
  select
    s.*,
    concat_ws(
      '|',
      s.linked_place_id,
      lower(btrim(s.title)),
      round(s.latitude::numeric, 7)::text,
      round(s.longitude::numeric, 7)::text
    ) as group_key
  from public.spots s
  where s.is_hidden = false
    and s.link_status = 'linked'
    and s.linked_place_id is not null
    and btrim(s.linked_place_id) <> ''
    and s.title is not null
    and btrim(s.title) <> ''
    and s.latitude is not null
    and s.longitude is not null
),
duplicate_groups as (
  select group_key
  from visible_linked
  group by group_key
  having count(*) > 1
),
scored as (
  select
    v.id,
    v.group_key,
    v.created_at,
    (
      (select count(*) from public.pins p where p.spot_id = v.id) * 1000
      + (select count(*) from public.pin_tags pt where pt.spot_id = v.id) * 100
      + (select count(*) from public.spot_personal_images spi where spi.spot_id = v.id) * 10
      + (select count(*) from public.spot_images si where si.spot_id = v.id)
      + case when v.cover_image_url is not null and btrim(v.cover_image_url) <> '' then 1 else 0 end
    ) as relation_score
  from visible_linked v
  join duplicate_groups dg on dg.group_key = v.group_key
),
ranked as (
  select
    s.*,
    row_number() over (
      partition by s.group_key
      order by s.relation_score desc, s.created_at asc, s.id asc
    ) as rn
  from scored s
),
canonical as (
  select group_key, id as canonical_spot_id
  from ranked
  where rn = 1
)
select
  r.group_key,
  c.canonical_spot_id,
  r.id as duplicate_spot_id
from ranked r
join canonical c on c.group_key = r.group_key
where r.rn > 1;

insert into public.spots_linked_exact_dedupe_039_backup (
  duplicate_spot_id,
  canonical_spot_id,
  group_key,
  spot_snapshot,
  pins_snapshot,
  pin_tags_snapshot,
  spot_images_snapshot,
  spot_personal_images_snapshot
)
select
  d.duplicate_spot_id,
  d.canonical_spot_id,
  d.group_key,
  to_jsonb(s),
  coalesce((select jsonb_agg(to_jsonb(p)) from public.pins p where p.spot_id = d.duplicate_spot_id), '[]'::jsonb),
  coalesce((select jsonb_agg(to_jsonb(pt)) from public.pin_tags pt where pt.spot_id = d.duplicate_spot_id), '[]'::jsonb),
  coalesce((select jsonb_agg(to_jsonb(si)) from public.spot_images si where si.spot_id = d.duplicate_spot_id), '[]'::jsonb),
  coalesce((select jsonb_agg(to_jsonb(spi)) from public.spot_personal_images spi where spi.spot_id = d.duplicate_spot_id), '[]'::jsonb)
from tmp_spots_linked_exact_dedupe_039 d
join public.spots s on s.id = d.duplicate_spot_id
on conflict (duplicate_spot_id) do nothing;

-- Preserve a cover on the canonical spot when it only exists on a duplicate.
update public.spots canonical
set cover_image_url = duplicate.cover_image_url
from tmp_spots_linked_exact_dedupe_039 d
join public.spots duplicate on duplicate.id = d.duplicate_spot_id
where canonical.id = d.canonical_spot_id
  and (canonical.cover_image_url is null or btrim(canonical.cover_image_url) = '')
  and duplicate.cover_image_url is not null
  and btrim(duplicate.cover_image_url) <> '';

-- Merge pin state into the canonical spot. The 037 trigger keeps status derived.
insert into public.pins (spot_id, user_id, saved, visited, status, created_at)
select
  d.canonical_spot_id,
  p.user_id,
  case when bool_or(coalesce(p.visited, false)) then false else bool_or(coalesce(p.saved, false)) end as saved,
  bool_or(coalesce(p.visited, false)) as visited,
  case when bool_or(coalesce(p.visited, false)) then 'visited' else 'to_visit' end as status,
  min(p.created_at) as created_at
from tmp_spots_linked_exact_dedupe_039 d
join public.pins p on p.spot_id = d.duplicate_spot_id
group by d.canonical_spot_id, p.user_id
on conflict (user_id, spot_id) do update
set
  visited = coalesce(public.pins.visited, false) or coalesce(excluded.visited, false),
  saved = case
    when coalesce(public.pins.visited, false) or coalesce(excluded.visited, false) then false
    else coalesce(public.pins.saved, false) or coalesce(excluded.saved, false)
  end,
  status = case
    when coalesce(public.pins.visited, false) or coalesce(excluded.visited, false) then 'visited'
    else 'to_visit'
  end,
  created_at = least(public.pins.created_at, excluded.created_at);

-- Re-home personal taxonomy and media to the canonical spot.
insert into public.pin_tags (user_id, spot_id, tag_id, created_at)
select
  pt.user_id,
  d.canonical_spot_id,
  pt.tag_id,
  pt.created_at
from tmp_spots_linked_exact_dedupe_039 d
join public.pin_tags pt on pt.spot_id = d.duplicate_spot_id
on conflict (user_id, spot_id, tag_id) do nothing;

update public.spot_images si
set spot_id = d.canonical_spot_id
from tmp_spots_linked_exact_dedupe_039 d
where si.spot_id = d.duplicate_spot_id;

update public.spot_personal_images spi
set spot_id = d.canonical_spot_id
from tmp_spots_linked_exact_dedupe_039 d
where spi.spot_id = d.duplicate_spot_id;

-- Remove duplicate relationships after backup + merge so hidden spots do not keep counting anywhere.
delete from public.pin_tags pt
using tmp_spots_linked_exact_dedupe_039 d
where pt.spot_id = d.duplicate_spot_id;

delete from public.pins p
using tmp_spots_linked_exact_dedupe_039 d
where p.spot_id = d.duplicate_spot_id;

-- Soft-hide duplicate spots. No hard delete.
update public.spots s
set
  is_hidden = true,
  updated_at = now()
from tmp_spots_linked_exact_dedupe_039 d
where s.id = d.duplicate_spot_id
  and s.is_hidden = false;

-- DB-level recurrence guard for exact duplicate linked visible spots.
create unique index if not exists spots_visible_linked_exact_unique_039
on public.spots (
  linked_place_id,
  lower(btrim(title)),
  round(latitude::numeric, 7),
  round(longitude::numeric, 7)
)
where is_hidden = false
  and link_status = 'linked'
  and linked_place_id is not null
  and btrim(linked_place_id) <> ''
  and title is not null
  and btrim(title) <> ''
  and latitude is not null
  and longitude is not null;
