-- GEO_IDENTITY_PREMIGRATION_DIAGNOSTIC_2026-04-28.sql
--
-- Read-only diagnostic for OL-DATA-MODEL-INTROSPECTION-001 / OL-GEO-CANON-001.
-- Purpose: understand how much geo-like data currently lives in public.spots
-- before creating geo_* tables or writing any migration.
--
-- Safety:
-- - SELECT-only.
-- - No DDL.
-- - No DML.
-- - No Storage operations.
-- - Run in Supabase SQL Editor or psql against the target environment.
--
-- Canon:
-- - docs/contracts/GEO_IDENTITY_DEDUP_V1.md
-- - docs/contracts/DATA_MODEL_CURRENT.md

-- 0) Schema presence: these tables should normally not exist before OL-GEO-CANON-001.
select
  'schema_presence' as check_name,
  expected.table_name,
  exists (
    select 1
    from information_schema.tables t
    where t.table_schema = 'public'
      and t.table_name = expected.table_name
  ) as exists_in_public_schema
from (
  values
    ('geo_countries'),
    ('geo_regions'),
    ('geo_cities'),
    ('geo_areas'),
    ('geo_aliases'),
    ('geo_external_refs'),
    ('user_geo_marks')
) as expected(table_name)
order by expected.table_name;

-- 1) Current spot population by provider kind/type.
select
  'spots_by_provider_kind' as check_name,
  coalesce(nullif(btrim(linked_place_kind), ''), '<null>') as linked_place_kind,
  coalesce(nullif(btrim(mapbox_feature_type), ''), '<null>') as mapbox_feature_type,
  count(*) as spots_count,
  count(*) filter (where is_hidden = false) as visible_count,
  count(*) filter (where linked_place_id is not null and btrim(linked_place_id) <> '') as with_linked_place_id
from public.spots
group by
  coalesce(nullif(btrim(linked_place_kind), ''), '<null>'),
  coalesce(nullif(btrim(mapbox_feature_type), ''), '<null>')
order by spots_count desc, linked_place_kind, mapbox_feature_type;

-- 2) Spots that look geo-like by Mapbox/provider metadata.
-- Review manually. This is not a deletion or migration list.
select
  'geo_like_spots_by_provider_metadata' as check_name,
  s.id,
  s.title,
  s.address,
  s.latitude,
  s.longitude,
  s.is_hidden,
  s.link_status,
  s.linked_place_id,
  s.linked_place_kind,
  s.mapbox_feature_type,
  s.created_at,
  s.updated_at
from public.spots s
where
  lower(coalesce(s.linked_place_kind, '')) in (
    'country',
    'region',
    'district',
    'place',
    'locality',
    'neighborhood',
    'postcode'
  )
  or lower(coalesce(s.mapbox_feature_type, '')) in (
    'country',
    'region',
    'district',
    'place',
    'locality',
    'neighborhood',
    'postcode'
  )
order by
  s.is_hidden asc,
  s.mapbox_feature_type nulls last,
  s.linked_place_kind nulls last,
  s.title;

-- 3) Repeated linked_place_id values in visible spots.
-- Some repeated provider ids can be valid historical ambiguity; this only identifies review groups.
select
  'visible_spots_repeated_linked_place_id' as check_name,
  linked_place_id,
  count(*) as spots_count,
  array_agg(id order by created_at, id) as spot_ids,
  array_agg(title order by created_at, id) as titles,
  array_agg(distinct linked_place_kind) filter (where linked_place_kind is not null) as linked_place_kinds,
  array_agg(distinct mapbox_feature_type) filter (where mapbox_feature_type is not null) as mapbox_feature_types,
  min(created_at) as first_created_at,
  max(created_at) as last_created_at
from public.spots
where is_hidden = false
  and linked_place_id is not null
  and btrim(linked_place_id) <> ''
group by linked_place_id
having count(*) > 1
order by spots_count desc, first_created_at;

-- 4) Exact visible title duplicates, normalized lightly without requiring extensions.
with normalized_spots as (
  select
    s.*,
    btrim(
      regexp_replace(
        translate(
          lower(coalesce(s.title, '')),
          'áàäâéèëêíìïîóòöôúùüûñç',
          'aaaaeeeeiiiioooouuuunc'
        ),
        '[^a-z0-9]+',
        ' ',
        'g'
      )
    ) as title_key
  from public.spots s
  where s.is_hidden = false
)
select
  'visible_spots_repeated_title' as check_name,
  title_key,
  count(*) as spots_count,
  array_agg(id order by created_at, id) as spot_ids,
  array_agg(title order by created_at, id) as titles,
  min(created_at) as first_created_at,
  max(created_at) as last_created_at
from normalized_spots
where title_key <> ''
group by title_key
having count(*) > 1
order by spots_count desc, title_key;

-- 5) Near-exact duplicates by normalized title + rounded coordinates.
-- Useful for POI/landmark duplicate risk, not specifically geo.
with normalized_spots as (
  select
    s.*,
    btrim(
      regexp_replace(
        translate(
          lower(coalesce(s.title, '')),
          'áàäâéèëêíìïîóòöôúùüûñç',
          'aaaaeeeeiiiioooouuuunc'
        ),
        '[^a-z0-9]+',
        ' ',
        'g'
      )
    ) as title_key,
    round(s.latitude::numeric, 5) as lat5,
    round(s.longitude::numeric, 5) as lon5
  from public.spots s
  where s.is_hidden = false
    and s.latitude is not null
    and s.longitude is not null
)
select
  'visible_spots_title_coordinate_duplicates' as check_name,
  title_key,
  lat5,
  lon5,
  count(*) as spots_count,
  array_agg(id order by created_at, id) as spot_ids,
  array_agg(title order by created_at, id) as titles,
  min(created_at) as first_created_at,
  max(created_at) as last_created_at
from normalized_spots
where title_key <> ''
group by title_key, lat5, lon5
having count(*) > 1
order by spots_count desc, title_key;

-- 6) Seed-case detector for the first geo canon scope.
-- This catches likely problematic geo-as-spot rows before introducing geo_*.
with seed_aliases(entity_type, canonical_name, alias_key, expected_country_iso2) as (
  values
    ('country', 'Mexico', 'mexico', 'MX'),
    ('country', 'United States', 'united states', 'US'),
    ('country', 'Georgia', 'georgia', null),
    ('region', 'Quintana Roo', 'quintana roo', 'MX'),
    ('region', 'Yucatan', 'yucatan', 'MX'),
    ('city', 'Merida', 'merida', 'MX'),
    ('city', 'San Jose', 'san jose', null),
    ('city', 'Holbox', 'holbox', 'MX'),
    ('area', 'Isla Holbox', 'isla holbox', 'MX')
),
normalized_spots as (
  select
    s.*,
    btrim(
      regexp_replace(
        translate(
          lower(coalesce(s.title, '')),
          'áàäâéèëêíìïîóòöôúùüûñç',
          'aaaaeeeeiiiioooouuuunc'
        ),
        '[^a-z0-9]+',
        ' ',
        'g'
      )
    ) as title_key
  from public.spots s
)
select
  'seed_case_spot_title_matches' as check_name,
  a.entity_type,
  a.canonical_name,
  a.expected_country_iso2,
  s.id,
  s.title,
  s.address,
  s.latitude,
  s.longitude,
  s.is_hidden,
  s.linked_place_id,
  s.linked_place_kind,
  s.mapbox_feature_type,
  s.created_at
from seed_aliases a
join normalized_spots s on s.title_key = a.alias_key
order by a.entity_type, a.canonical_name, s.is_hidden, s.created_at;

-- 7) Address tail heuristics: possible countries/regions/cities embedded in address text.
-- This is only a sizing signal. Address text is not identity.
with address_tail as (
  select
    id,
    title,
    address,
    nullif(btrim(split_part(reverse(address), ',', 1)), '') as reversed_last_token
  from public.spots
  where address is not null
    and btrim(address) <> ''
),
normalized_tail as (
  select
    id,
    title,
    address,
    reverse(reversed_last_token) as last_address_token,
    btrim(
      regexp_replace(
        translate(
          lower(reverse(reversed_last_token)),
          'áàäâéèëêíìïîóòöôúùüûñç',
          'aaaaeeeeiiiioooouuuunc'
        ),
        '[^a-z0-9]+',
        ' ',
        'g'
      )
    ) as last_address_token_key
  from address_tail
  where reversed_last_token is not null
)
select
  'address_tail_distribution_not_identity' as check_name,
  last_address_token,
  last_address_token_key,
  count(*) as spots_count,
  (array_agg(id order by id))[1:10] as sample_spot_ids
from normalized_tail
where last_address_token_key <> ''
group by last_address_token, last_address_token_key
order by spots_count desc, last_address_token_key
limit 50;

-- 8) BBox metadata by geo-like kinds after 034 cleanup.
select
  'geo_like_bbox_presence' as check_name,
  coalesce(nullif(btrim(linked_place_kind), ''), '<null>') as linked_place_kind,
  coalesce(nullif(btrim(mapbox_feature_type), ''), '<null>') as mapbox_feature_type,
  count(*) as spots_count,
  count(*) filter (where mapbox_bbox is not null) as with_mapbox_bbox
from public.spots
where
  lower(coalesce(linked_place_kind, '')) in ('country', 'region', 'district', 'place', 'locality', 'neighborhood')
  or lower(coalesce(mapbox_feature_type, '')) in ('country', 'region', 'district', 'place', 'locality', 'neighborhood')
group by
  coalesce(nullif(btrim(linked_place_kind), ''), '<null>'),
  coalesce(nullif(btrim(mapbox_feature_type), ''), '<null>')
order by spots_count desc;

-- 9) Relation sizing: how many user relationships/media would be affected if a spot is later reclassified or merged.
-- This is not an action list; it helps estimate migration/backfill risk.
with spot_relation_counts as (
  select
    s.id,
    s.title,
    s.is_hidden,
    s.linked_place_kind,
    s.mapbox_feature_type,
    (select count(*) from public.pins p where p.spot_id = s.id) as pins_count,
    (select count(*) from public.pin_tags pt where pt.spot_id = s.id) as pin_tags_count,
    (select count(*) from public.spot_images si where si.spot_id = s.id) as public_images_count,
    (select count(*) from public.spot_personal_images spi where spi.spot_id = s.id) as personal_images_count
  from public.spots s
)
select
  'geo_like_relation_risk' as check_name,
  *
from spot_relation_counts
where
  lower(coalesce(linked_place_kind, '')) in ('country', 'region', 'district', 'place', 'locality', 'neighborhood')
  or lower(coalesce(mapbox_feature_type, '')) in ('country', 'region', 'district', 'place', 'locality', 'neighborhood')
order by
  (pins_count + pin_tags_count + public_images_count + personal_images_count) desc,
  title;

-- 10) Final sizing summary for go/no-go.
with geo_like as (
  select id
  from public.spots
  where
    lower(coalesce(linked_place_kind, '')) in ('country', 'region', 'district', 'place', 'locality', 'neighborhood')
    or lower(coalesce(mapbox_feature_type, '')) in ('country', 'region', 'district', 'place', 'locality', 'neighborhood')
),
visible_repeated_linked_place_id as (
  select linked_place_id
  from public.spots
  where is_hidden = false
    and linked_place_id is not null
    and btrim(linked_place_id) <> ''
  group by linked_place_id
  having count(*) > 1
),
visible_repeated_title as (
  select title_key
  from (
    select
      btrim(
        regexp_replace(
          translate(
            lower(coalesce(title, '')),
            'áàäâéèëêíìïîóòöôúùüûñç',
            'aaaaeeeeiiiioooouuuunc'
          ),
          '[^a-z0-9]+',
          ' ',
          'g'
        )
      ) as title_key
    from public.spots
    where is_hidden = false
  ) normalized
  where title_key <> ''
  group by title_key
  having count(*) > 1
)
select
  'premigration_summary' as check_name,
  (select count(*) from public.spots) as spots_total,
  (select count(*) from public.spots where is_hidden = false) as visible_spots,
  (select count(*) from geo_like) as geo_like_spots_by_provider_metadata,
  (select count(*) from visible_repeated_linked_place_id) as repeated_linked_place_id_groups,
  (select count(*) from visible_repeated_title) as repeated_visible_title_groups,
  now() as inspected_at;
