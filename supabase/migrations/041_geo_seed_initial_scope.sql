-- 041_geo_seed_initial_scope.sql
--
-- Minimal, controlled geo seed for Flowya V1 QA.
--
-- Scope:
-- - seed a tiny set of countries, Mexican regions and cities/localities needed for
--   Search/GeoSheet QA;
-- - keep countries/regions/cities out of public.spots;
-- - add aliases for ES/EN search recovery;
-- - add stable internal/ISO refs only.
--
-- No-go:
-- - no world seed;
-- - no backfill;
-- - no spots/pins mutation;
-- - no Storage operation;
-- - no geo_areas table in this migration.
--
-- Rollback sketch:
--   If no runtime/user data references these rows, delete rows where source='flowya_seed_041'
--   in dependency order: geo_external_refs, geo_aliases, geo_cities, geo_regions, geo_countries.
--   If already consumed, prefer is_active=false plus a corrective migration.

begin;

with country_seed as (
  select *
  from (
    values
      ('MX', 'MEX', 'Mexico', 'Mexico', 'mexico', 23.6345::double precision, -102.5528::double precision, '{"west": -118.5, "south": 14.5, "east": -86.7, "north": 32.8}'::jsonb),
      ('US', 'USA', 'Estados Unidos', 'United States', 'united-states', 39.8283::double precision, -98.5795::double precision, '{"west": -125.0, "south": 24.5, "east": -66.9, "north": 49.4}'::jsonb),
      ('CR', 'CRI', 'Costa Rica', 'Costa Rica', 'costa-rica', 9.7489::double precision, -83.7534::double precision, '{"west": -86.0, "south": 8.0, "east": -82.5, "north": 11.3}'::jsonb),
      ('PA', 'PAN', 'Panama', 'Panama', 'panama', 8.5380::double precision, -80.7821::double precision, '{"west": -83.1, "south": 7.2, "east": -77.1, "north": 9.7}'::jsonb)
  ) as seed(iso2, iso3, name_es, name_en, slug, centroid_latitude, centroid_longitude, bbox)
)
insert into public.geo_countries (
  iso2,
  iso3,
  name_es,
  name_en,
  slug,
  centroid_latitude,
  centroid_longitude,
  bbox,
  source,
  source_updated_at,
  is_active
)
select
  iso2,
  iso3,
  name_es,
  name_en,
  slug,
  centroid_latitude,
  centroid_longitude,
  bbox,
  'flowya_seed_041',
  '2026-04-28'::timestamptz,
  true
from country_seed
on conflict (iso2) do update
set
  iso3 = excluded.iso3,
  name_es = excluded.name_es,
  name_en = excluded.name_en,
  slug = excluded.slug,
  centroid_latitude = excluded.centroid_latitude,
  centroid_longitude = excluded.centroid_longitude,
  bbox = excluded.bbox,
  source = excluded.source,
  source_updated_at = excluded.source_updated_at,
  is_active = excluded.is_active;

with region_seed as (
  select *
  from (
    values
      ('MX', 'MX-ROO', 'Quintana Roo', 'Quintana Roo', 'quintana-roo', 'state', 19.1817::double precision, -88.4791::double precision, '{"west": -89.4, "south": 17.8, "east": -86.7, "north": 21.7}'::jsonb),
      ('MX', 'MX-YUC', 'Yucatan', 'Yucatan', 'yucatan', 'state', 20.7099::double precision, -89.0943::double precision, '{"west": -90.4, "south": 19.5, "east": -87.5, "north": 21.6}'::jsonb)
  ) as seed(country_iso2, region_code, name_es, name_en, slug, region_type, centroid_latitude, centroid_longitude, bbox)
)
insert into public.geo_regions (
  country_id,
  region_code,
  name_es,
  name_en,
  slug,
  region_type,
  centroid_latitude,
  centroid_longitude,
  bbox,
  source,
  source_updated_at,
  is_active
)
select
  c.id,
  rs.region_code,
  rs.name_es,
  rs.name_en,
  rs.slug,
  rs.region_type,
  rs.centroid_latitude,
  rs.centroid_longitude,
  rs.bbox,
  'flowya_seed_041',
  '2026-04-28'::timestamptz,
  true
from region_seed rs
join public.geo_countries c on c.iso2 = rs.country_iso2
on conflict (country_id, region_code) do update
set
  name_es = excluded.name_es,
  name_en = excluded.name_en,
  slug = excluded.slug,
  region_type = excluded.region_type,
  centroid_latitude = excluded.centroid_latitude,
  centroid_longitude = excluded.centroid_longitude,
  bbox = excluded.bbox,
  source = excluded.source,
  source_updated_at = excluded.source_updated_at,
  is_active = excluded.is_active;

with city_seed as (
  select *
  from (
    values
      ('MX', 'MX-YUC', 'Merida', 'Merida', 'Merida', 'merida', 'city', 20.9674::double precision, -89.5926::double precision, '{"west": -89.75, "south": 20.82, "east": -89.45, "north": 21.08}'::jsonb, '250k_1m'),
      ('MX', 'MX-ROO', 'Holbox', 'Holbox', 'Holbox', 'holbox', 'island_town', 21.5236::double precision, -87.3791::double precision, '{"west": -87.48, "south": 21.48, "east": -87.31, "north": 21.57}'::jsonb, 'lt_10k'),
      ('CR', null, 'San Jose', 'San Jose', 'San Jose', 'san-jose', 'city', 9.9281::double precision, -84.0907::double precision, '{"west": -84.2, "south": 9.85, "east": -84.0, "north": 10.02}'::jsonb, '250k_1m')
  ) as seed(
    country_iso2,
    region_code,
    official_name,
    name_es,
    name_en,
    slug,
    city_type,
    centroid_latitude,
    centroid_longitude,
    bbox,
    population_bucket
  )
),
city_rows as (
  select
    c.id as country_id,
    r.id as region_id,
    cs.official_name,
    cs.name_es,
    cs.name_en,
    cs.slug,
    cs.city_type,
    cs.centroid_latitude,
    cs.centroid_longitude,
    cs.bbox,
    cs.population_bucket
  from city_seed cs
  join public.geo_countries c on c.iso2 = cs.country_iso2
  left join public.geo_regions r
    on r.region_code = cs.region_code
    and r.country_id = c.id
)
insert into public.geo_cities (
  country_id,
  region_id,
  official_name,
  name_es,
  name_en,
  slug,
  city_type,
  centroid_latitude,
  centroid_longitude,
  bbox,
  population_bucket,
  source,
  source_updated_at,
  is_active
)
select
  country_id,
  region_id,
  official_name,
  name_es,
  name_en,
  slug,
  city_type,
  centroid_latitude,
  centroid_longitude,
  bbox,
  population_bucket,
  'flowya_seed_041',
  '2026-04-28'::timestamptz,
  true
from city_rows
on conflict do nothing;

with city_seed as (
  select *
  from (
    values
      ('MX', 'MX-YUC', 'Merida', 'Merida', 'Merida', 'merida', 'city', 20.9674::double precision, -89.5926::double precision, '{"west": -89.75, "south": 20.82, "east": -89.45, "north": 21.08}'::jsonb, '250k_1m'),
      ('MX', 'MX-ROO', 'Holbox', 'Holbox', 'Holbox', 'holbox', 'island_town', 21.5236::double precision, -87.3791::double precision, '{"west": -87.48, "south": 21.48, "east": -87.31, "north": 21.57}'::jsonb, 'lt_10k'),
      ('CR', null, 'San Jose', 'San Jose', 'San Jose', 'san-jose', 'city', 9.9281::double precision, -84.0907::double precision, '{"west": -84.2, "south": 9.85, "east": -84.0, "north": 10.02}'::jsonb, '250k_1m')
  ) as seed(
    country_iso2,
    region_code,
    official_name,
    name_es,
    name_en,
    slug,
    city_type,
    centroid_latitude,
    centroid_longitude,
    bbox,
    population_bucket
  )
),
city_rows as (
  select
    c.id as country_id,
    r.id as region_id,
    cs.official_name,
    cs.name_es,
    cs.name_en,
    cs.slug,
    cs.city_type,
    cs.centroid_latitude,
    cs.centroid_longitude,
    cs.bbox,
    cs.population_bucket
  from city_seed cs
  join public.geo_countries c on c.iso2 = cs.country_iso2
  left join public.geo_regions r
    on r.region_code = cs.region_code
    and r.country_id = c.id
)
update public.geo_cities gc
set
  official_name = cr.official_name,
  name_es = cr.name_es,
  name_en = cr.name_en,
  city_type = cr.city_type,
  centroid_latitude = cr.centroid_latitude,
  centroid_longitude = cr.centroid_longitude,
  bbox = cr.bbox,
  population_bucket = cr.population_bucket,
  source = 'flowya_seed_041',
  source_updated_at = '2026-04-28'::timestamptz,
  is_active = true
from city_rows cr
where gc.country_id = cr.country_id
  and coalesce(gc.region_id, '00000000-0000-0000-0000-000000000000'::uuid)
    = coalesce(cr.region_id, '00000000-0000-0000-0000-000000000000'::uuid)
  and gc.slug = cr.slug;

with country_aliases as (
  select *
  from (
    values
      ('country', 'MX', 'es', 'Mexico', 'mexico', true),
      ('country', 'MX', 'es', 'México', 'mexico', false),
      ('country', 'MX', 'en', 'Mexico', 'mexico', true),
      ('country', 'US', 'es', 'Estados Unidos', 'estados unidos', true),
      ('country', 'US', 'en', 'United States', 'united states', true),
      ('country', 'US', null, 'USA', 'usa', false),
      ('country', 'US', null, 'US', 'us', false),
      ('country', 'CR', 'es', 'Costa Rica', 'costa rica', true),
      ('country', 'CR', 'en', 'Costa Rica', 'costa rica', true),
      ('country', 'PA', 'es', 'Panama', 'panama', true),
      ('country', 'PA', 'es', 'Panamá', 'panama', false),
      ('country', 'PA', 'en', 'Panama', 'panama', true)
  ) as seed(entity_type, iso2, locale, name, normalized_name, is_primary)
),
region_aliases as (
  select *
  from (
    values
      ('region', 'MX-ROO', 'es', 'Quintana Roo', 'quintana roo', true),
      ('region', 'MX-ROO', 'en', 'Quintana Roo', 'quintana roo', true),
      ('region', 'MX-YUC', 'es', 'Yucatan', 'yucatan', true),
      ('region', 'MX-YUC', 'es', 'Yucatán', 'yucatan', false),
      ('region', 'MX-YUC', 'en', 'Yucatan', 'yucatan', true)
  ) as seed(entity_type, region_code, locale, name, normalized_name, is_primary)
),
city_aliases as (
  select *
  from (
    values
      ('city', 'MX', 'MX-YUC', 'merida', 'es', 'Merida', 'merida', true),
      ('city', 'MX', 'MX-YUC', 'merida', 'es', 'Mérida', 'merida', false),
      ('city', 'MX', 'MX-YUC', 'merida', 'en', 'Merida', 'merida', true),
      ('city', 'MX', 'MX-ROO', 'holbox', 'es', 'Holbox', 'holbox', true),
      ('city', 'MX', 'MX-ROO', 'holbox', 'es', 'Isla Holbox', 'isla holbox', false),
      ('city', 'MX', 'MX-ROO', 'holbox', 'en', 'Holbox', 'holbox', true),
      ('city', 'CR', null, 'san-jose', 'es', 'San Jose', 'san jose', true),
      ('city', 'CR', null, 'san-jose', 'es', 'San José', 'san jose', false),
      ('city', 'CR', null, 'san-jose', 'en', 'San Jose', 'san jose', true)
  ) as seed(entity_type, country_iso2, region_code, city_slug, locale, name, normalized_name, is_primary)
),
resolved_aliases as (
  select
    ca.entity_type,
    c.id as entity_id,
    ca.locale,
    ca.name,
    ca.normalized_name,
    ca.is_primary
  from country_aliases ca
  join public.geo_countries c on c.iso2 = ca.iso2
  union all
  select
    ra.entity_type,
    r.id,
    ra.locale,
    ra.name,
    ra.normalized_name,
    ra.is_primary
  from region_aliases ra
  join public.geo_regions r on r.region_code = ra.region_code
  union all
  select
    cia.entity_type,
    gc.id,
    cia.locale,
    cia.name,
    cia.normalized_name,
    cia.is_primary
  from city_aliases cia
  join public.geo_countries c on c.iso2 = cia.country_iso2
  left join public.geo_regions r
    on r.country_id = c.id
    and r.region_code = cia.region_code
  join public.geo_cities gc
    on gc.country_id = c.id
    and coalesce(gc.region_id, '00000000-0000-0000-0000-000000000000'::uuid)
      = coalesce(r.id, '00000000-0000-0000-0000-000000000000'::uuid)
    and gc.slug = cia.city_slug
)
insert into public.geo_aliases (
  entity_type,
  entity_id,
  locale,
  name,
  normalized_name,
  source,
  is_primary,
  is_active
)
select
  entity_type,
  entity_id,
  locale,
  name,
  normalized_name,
  'flowya_seed_041',
  is_primary,
  true
from resolved_aliases
on conflict do nothing;

with country_refs as (
  select
    'country' as entity_type,
    c.id as entity_id,
    'iso' as provider,
    c.iso2 as provider_ref,
    'iso3166-1-alpha2' as provider_kind,
    1::numeric as confidence
  from public.geo_countries c
  where c.iso2 in ('MX', 'US', 'CR', 'PA')
),
country_refs_iso3 as (
  select
    'country' as entity_type,
    c.id as entity_id,
    'iso' as provider,
    c.iso3 as provider_ref,
    'iso3166-1-alpha3' as provider_kind,
    1::numeric as confidence
  from public.geo_countries c
  where c.iso2 in ('MX', 'US', 'CR', 'PA')
),
region_refs as (
  select
    'region' as entity_type,
    r.id as entity_id,
    'iso' as provider,
    r.region_code as provider_ref,
    'iso3166-2' as provider_kind,
    1::numeric as confidence
  from public.geo_regions r
  where r.region_code in ('MX-ROO', 'MX-YUC')
),
flowya_refs as (
  select
    'country' as entity_type,
    c.id as entity_id,
    'flowya' as provider,
    'flowya_seed_041:country:' || c.iso2 as provider_ref,
    'seed' as provider_kind,
    1::numeric as confidence
  from public.geo_countries c
  where c.iso2 in ('MX', 'US', 'CR', 'PA')
  union all
  select
    'region',
    r.id,
    'flowya',
    'flowya_seed_041:region:' || r.region_code,
    'seed',
    1::numeric
  from public.geo_regions r
  where r.region_code in ('MX-ROO', 'MX-YUC')
  union all
  select
    'city',
    gc.id,
    'flowya',
    'flowya_seed_041:city:' || c.iso2 || ':' || coalesce(r.region_code, 'none') || ':' || gc.slug,
    'seed',
    1::numeric
  from public.geo_cities gc
  join public.geo_countries c on c.id = gc.country_id
  left join public.geo_regions r on r.id = gc.region_id
  where (c.iso2, coalesce(r.region_code, 'none'), gc.slug) in (
    ('MX', 'MX-YUC', 'merida'),
    ('MX', 'MX-ROO', 'holbox'),
    ('CR', 'none', 'san-jose')
  )
),
all_refs as (
  select * from country_refs
  union all
  select * from country_refs_iso3
  union all
  select * from region_refs
  union all
  select * from flowya_refs
)
insert into public.geo_external_refs (
  entity_type,
  entity_id,
  provider,
  provider_ref,
  provider_kind,
  confidence,
  source_updated_at,
  is_active
)
select
  entity_type,
  entity_id,
  provider,
  provider_ref,
  provider_kind,
  confidence,
  '2026-04-28'::timestamptz,
  true
from all_refs
on conflict (provider, provider_ref, entity_type) do update
set
  entity_id = excluded.entity_id,
  provider_kind = excluded.provider_kind,
  confidence = excluded.confidence,
  source_updated_at = excluded.source_updated_at,
  is_active = excluded.is_active;

commit;
