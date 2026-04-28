-- GEO_CORE_TABLES_POSTMIGRATION_VERIFY_2026-04-28.sql
--
-- Read-only verification for migration 040_geo_core_tables.sql.
-- Run only after applying 040 to the target Supabase environment.
--
-- Safety:
-- - SELECT-only.
-- - No DDL.
-- - No DML.
-- - No Storage operations.
--
-- Expected result:
-- - five geo tables exist in public schema;
-- - RLS is enabled on all five tables;
-- - active-read policies exist;
-- - updated_at triggers exist;
-- - no seed rows are required by 040;
-- - spots are unchanged by 040.

-- 1) Geo table presence and RLS status.
select
  'geo_table_presence_rls' as check_name,
  expected.table_name,
  c.oid is not null as exists_in_public_schema,
  coalesce(c.relrowsecurity, false) as rls_enabled,
  coalesce(c.relforcerowsecurity, false) as force_rls_enabled
from (
  values
    ('geo_countries'),
    ('geo_regions'),
    ('geo_cities'),
    ('geo_aliases'),
    ('geo_external_refs')
) as expected(table_name)
left join pg_namespace n
  on n.nspname = 'public'
left join pg_class c
  on c.relname = expected.table_name
  and c.relnamespace = n.oid
order by expected.table_name;

-- 2) Active-read RLS policies expected by 040.
select
  'geo_active_read_policies' as check_name,
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  qual
from pg_policies
where schemaname = 'public'
  and tablename in (
    'geo_countries',
    'geo_regions',
    'geo_cities',
    'geo_aliases',
    'geo_external_refs'
  )
order by tablename, policyname;

-- 3) Indexes and uniqueness guards expected by 040.
select
  'geo_indexes' as check_name,
  schemaname,
  tablename,
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and (
    tablename in (
      'geo_countries',
      'geo_regions',
      'geo_cities',
      'geo_aliases',
      'geo_external_refs'
    )
    or indexname in (
      'geo_cities_country_region_slug_unique',
      'geo_aliases_unique',
      'geo_aliases_lookup_idx',
      'geo_external_refs_entity_idx',
      'geo_regions_country_idx',
      'geo_cities_country_idx',
      'geo_cities_region_idx'
    )
  )
order by tablename, indexname;

-- 4) updated_at trigger presence.
select
  'geo_updated_at_triggers' as check_name,
  event_object_schema,
  event_object_table,
  trigger_name,
  action_timing,
  event_manipulation
from information_schema.triggers
where event_object_schema = 'public'
  and event_object_table in (
    'geo_countries',
    'geo_regions',
    'geo_cities',
    'geo_aliases',
    'geo_external_refs'
  )
order by event_object_table, trigger_name;

-- 5) Column contract snapshot.
select
  'geo_column_contract' as check_name,
  table_schema,
  table_name,
  ordinal_position,
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in (
    'geo_countries',
    'geo_regions',
    'geo_cities',
    'geo_aliases',
    'geo_external_refs'
  )
order by table_name, ordinal_position;

-- 6) 040 should not seed rows.
select
  'geo_row_counts_after_040' as check_name,
  'geo_countries' as table_name,
  count(*) as row_count
from public.geo_countries
union all
select 'geo_row_counts_after_040', 'geo_regions', count(*) from public.geo_regions
union all
select 'geo_row_counts_after_040', 'geo_cities', count(*) from public.geo_cities
union all
select 'geo_row_counts_after_040', 'geo_aliases', count(*) from public.geo_aliases
union all
select 'geo_row_counts_after_040', 'geo_external_refs', count(*) from public.geo_external_refs
order by table_name;

-- 7) Spots population sanity marker. Compare with pre-040 count in bitacora before applying.
select
  'spots_population_sanity' as check_name,
  count(*) as spots_total,
  count(*) filter (where is_hidden = false) as spots_visible
from public.spots;

-- 8) CLI-friendly summary. Supabase CLI returns the last result set, so this
-- section aggregates the critical checks into one final table.
with expected_tables(table_name) as (
  values
    ('geo_countries'),
    ('geo_regions'),
    ('geo_cities'),
    ('geo_aliases'),
    ('geo_external_refs')
),
table_status as (
  select
    e.table_name,
    c.oid is not null as exists_in_public_schema,
    coalesce(c.relrowsecurity, false) as rls_enabled
  from expected_tables e
  left join pg_namespace n
    on n.nspname = 'public'
  left join pg_class c
    on c.relname = e.table_name
    and c.relnamespace = n.oid
),
required_policies(policyname) as (
  values
    ('geo_countries_select_active'),
    ('geo_regions_select_active'),
    ('geo_cities_select_active'),
    ('geo_aliases_select_active'),
    ('geo_external_refs_select_active')
),
policy_status as (
  select
    p.policyname,
    exists (
      select 1
      from pg_policies gp
      where gp.schemaname = 'public'
        and gp.policyname = p.policyname
        and gp.cmd = 'SELECT'
        and gp.qual = '(is_active = true)'
    ) as exists_in_public_schema
  from required_policies p
),
required_indexes(indexname) as (
  values
    ('geo_cities_country_region_slug_unique'),
    ('geo_aliases_unique'),
    ('geo_aliases_lookup_idx'),
    ('geo_external_refs_entity_idx'),
    ('geo_regions_country_idx'),
    ('geo_cities_country_idx'),
    ('geo_cities_region_idx')
),
index_status as (
  select
    i.indexname,
    exists (
      select 1
      from pg_indexes pi
      where pi.schemaname = 'public'
        and pi.indexname = i.indexname
    ) as exists_in_public_schema
  from required_indexes i
),
required_triggers(trigger_name) as (
  values
    ('geo_countries_set_updated_at_trigger'),
    ('geo_regions_set_updated_at_trigger'),
    ('geo_cities_set_updated_at_trigger'),
    ('geo_aliases_set_updated_at_trigger'),
    ('geo_external_refs_set_updated_at_trigger')
),
trigger_status as (
  select
    t.trigger_name,
    exists (
      select 1
      from information_schema.triggers it
      where it.event_object_schema = 'public'
        and it.trigger_name = t.trigger_name
    ) as exists_in_public_schema
  from required_triggers t
),
geo_counts as (
  select 'geo_countries' as table_name, count(*) as row_count from public.geo_countries
  union all
  select 'geo_regions', count(*) from public.geo_regions
  union all
  select 'geo_cities', count(*) from public.geo_cities
  union all
  select 'geo_aliases', count(*) from public.geo_aliases
  union all
  select 'geo_external_refs', count(*) from public.geo_external_refs
),
spots_counts as (
  select
    count(*) as spots_total,
    count(*) filter (where is_hidden = false) as spots_visible
  from public.spots
)
select
  'summary_tables_exist_and_rls' as check_name,
  bool_and(exists_in_public_schema and rls_enabled) as passed,
  jsonb_agg(
    jsonb_build_object(
      'table_name', table_name,
      'exists', exists_in_public_schema,
      'rls_enabled', rls_enabled
    )
    order by table_name
  ) as details
from table_status
union all
select
  'summary_active_read_policies',
  bool_and(exists_in_public_schema),
  jsonb_agg(
    jsonb_build_object('policyname', policyname, 'exists', exists_in_public_schema)
    order by policyname
  )
from policy_status
union all
select
  'summary_required_indexes',
  bool_and(exists_in_public_schema),
  jsonb_agg(
    jsonb_build_object('indexname', indexname, 'exists', exists_in_public_schema)
    order by indexname
  )
from index_status
union all
select
  'summary_updated_at_triggers',
  bool_and(exists_in_public_schema),
  jsonb_agg(
    jsonb_build_object('trigger_name', trigger_name, 'exists', exists_in_public_schema)
    order by trigger_name
  )
from trigger_status
union all
select
  'summary_no_seed_rows_after_040',
  bool_and(row_count = 0),
  jsonb_agg(
    jsonb_build_object('table_name', table_name, 'row_count', row_count)
    order by table_name
  )
from geo_counts
union all
select
  'summary_spots_population_unchanged_from_405',
  spots_total = 313 and spots_visible = 304,
  jsonb_build_array(
    jsonb_build_object('spots_total', spots_total, 'spots_visible', spots_visible)
  )
from spots_counts
order by check_name;
