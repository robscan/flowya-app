-- GEO_SEED_041_VERIFY_2026-04-28.sql
--
-- Read-only verification for migration 041_geo_seed_initial_scope.sql.
-- Run only after applying 041 to the target Supabase environment.
--
-- Safety:
-- - SELECT-only.
-- - No DDL.
-- - No DML.
-- - No Storage operations.

with expected_countries(iso2) as (
  values ('CR'), ('MX'), ('PA'), ('US')
),
country_status as (
  select
    e.iso2,
    c.id is not null as exists_in_public_schema,
    c.is_active,
    c.source
  from expected_countries e
  left join public.geo_countries c on c.iso2 = e.iso2
),
expected_regions(region_code) as (
  values ('MX-ROO'), ('MX-YUC')
),
region_status as (
  select
    e.region_code,
    r.id is not null as exists_in_public_schema,
    r.is_active,
    r.source
  from expected_regions e
  left join public.geo_regions r on r.region_code = e.region_code
),
expected_cities(country_iso2, region_code, slug) as (
  values
    ('CR', null, 'san-jose'),
    ('MX', 'MX-ROO', 'holbox'),
    ('MX', 'MX-YUC', 'merida')
),
city_status as (
  select
    e.country_iso2,
    e.region_code,
    e.slug,
    gc.id is not null as exists_in_public_schema,
    gc.is_active,
    gc.source,
    gc.city_type
  from expected_cities e
  left join public.geo_countries c on c.iso2 = e.country_iso2
  left join public.geo_regions r
    on r.country_id = c.id
    and r.region_code = e.region_code
  left join public.geo_cities gc
    on gc.country_id = c.id
    and coalesce(gc.region_id, '00000000-0000-0000-0000-000000000000'::uuid)
      = coalesce(r.id, '00000000-0000-0000-0000-000000000000'::uuid)
    and gc.slug = e.slug
),
source_counts as (
  select 'geo_countries' as table_name, count(*) as row_count
  from public.geo_countries
  where source = 'flowya_seed_041'
  union all
  select 'geo_regions', count(*)
  from public.geo_regions
  where source = 'flowya_seed_041'
  union all
  select 'geo_cities', count(*)
  from public.geo_cities
  where source = 'flowya_seed_041'
  union all
  select 'geo_aliases', count(*)
  from public.geo_aliases
  where source = 'flowya_seed_041'
  union all
  select 'geo_external_refs', count(*)
  from public.geo_external_refs
  where provider = 'flowya'
     or (provider = 'iso' and provider_ref in ('MX', 'MEX', 'US', 'USA', 'CR', 'CRI', 'PA', 'PAN', 'MX-ROO', 'MX-YUC'))
),
spots_counts as (
  select
    count(*) as spots_total,
    count(*) filter (where is_hidden = false) as spots_visible
  from public.spots
)
select
  'summary_seed_countries' as check_name,
  bool_and(exists_in_public_schema and is_active and source = 'flowya_seed_041') as passed,
  jsonb_agg(
    jsonb_build_object(
      'iso2', iso2,
      'exists', exists_in_public_schema,
      'is_active', is_active,
      'source', source
    )
    order by iso2
  ) as details
from country_status
union all
select
  'summary_seed_regions',
  bool_and(exists_in_public_schema and is_active and source = 'flowya_seed_041'),
  jsonb_agg(
    jsonb_build_object(
      'region_code', region_code,
      'exists', exists_in_public_schema,
      'is_active', is_active,
      'source', source
    )
    order by region_code
  )
from region_status
union all
select
  'summary_seed_cities',
  bool_and(exists_in_public_schema and is_active and source = 'flowya_seed_041'),
  jsonb_agg(
    jsonb_build_object(
      'country_iso2', country_iso2,
      'region_code', region_code,
      'slug', slug,
      'city_type', city_type,
      'exists', exists_in_public_schema,
      'is_active', is_active,
      'source', source
    )
    order by country_iso2, region_code, slug
  )
from city_status
union all
select
  'summary_seed_counts',
  bool_and(
    case table_name
      when 'geo_countries' then row_count = 4
      when 'geo_regions' then row_count = 2
      when 'geo_cities' then row_count = 3
      when 'geo_aliases' then row_count = 21
      when 'geo_external_refs' then row_count = 19
      else false
    end
  ),
  jsonb_agg(
    jsonb_build_object('table_name', table_name, 'row_count', row_count)
    order by table_name
  )
from source_counts
union all
select
  'summary_spots_population_unchanged_from_405',
  spots_total = 313 and spots_visible = 304,
  jsonb_build_array(
    jsonb_build_object('spots_total', spots_total, 'spots_visible', spots_visible)
  )
from spots_counts
order by check_name;
