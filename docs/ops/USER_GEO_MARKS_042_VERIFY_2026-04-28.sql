-- USER_GEO_MARKS_042_VERIFY_2026-04-28.sql
--
-- Read-only verification for migration 042_user_geo_marks.sql.
--
-- Safety:
-- - SELECT-only.
-- - No DDL.
-- - No DML.
-- - No Storage operations.

with table_status as (
  select
    c.oid is not null as exists_in_public_schema,
    coalesce(c.relrowsecurity, false) as rls_enabled
  from (select 'user_geo_marks'::text as table_name) expected
  left join pg_namespace n
    on n.nspname = 'public'
  left join pg_class c
    on c.relname = expected.table_name
    and c.relnamespace = n.oid
),
required_policies(policyname, cmd) as (
  values
    ('user_geo_marks_select_own', 'SELECT'),
    ('user_geo_marks_insert_own', 'INSERT'),
    ('user_geo_marks_update_own', 'UPDATE'),
    ('user_geo_marks_delete_own', 'DELETE')
),
policy_status as (
  select
    rp.policyname,
    rp.cmd,
    exists (
      select 1
      from pg_policies p
      where p.schemaname = 'public'
        and p.tablename = 'user_geo_marks'
        and p.policyname = rp.policyname
        and p.cmd = rp.cmd
        and p.roles = '{authenticated}'
    ) as exists_in_public_schema
  from required_policies rp
),
required_indexes(indexname) as (
  values
    ('user_geo_marks_pkey'),
    ('user_geo_marks_user_entity_unique'),
    ('user_geo_marks_user_idx'),
    ('user_geo_marks_entity_idx'),
    ('user_geo_marks_user_visited_idx')
),
index_status as (
  select
    ri.indexname,
    exists (
      select 1
      from pg_indexes i
      where i.schemaname = 'public'
        and i.tablename = 'user_geo_marks'
        and i.indexname = ri.indexname
    ) as exists_in_public_schema
  from required_indexes ri
),
trigger_status as (
  select exists (
    select 1
    from information_schema.triggers t
    where t.event_object_schema = 'public'
      and t.event_object_table = 'user_geo_marks'
      and t.trigger_name = 'user_geo_marks_normalize_state_trigger'
  ) as exists_in_public_schema
),
row_counts as (
  select count(*) as row_count
  from public.user_geo_marks
),
spots_counts as (
  select
    count(*) as spots_total,
    count(*) filter (where is_hidden = false) as spots_visible
  from public.spots
)
select
  'summary_table_exists_and_rls' as check_name,
  bool_and(exists_in_public_schema and rls_enabled) as passed,
  jsonb_agg(
    jsonb_build_object(
      'table_name', 'user_geo_marks',
      'exists', exists_in_public_schema,
      'rls_enabled', rls_enabled
    )
  ) as details
from table_status
union all
select
  'summary_owner_policies',
  bool_and(exists_in_public_schema),
  jsonb_agg(
    jsonb_build_object('policyname', policyname, 'cmd', cmd, 'exists', exists_in_public_schema)
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
  'summary_normalize_trigger',
  bool_and(exists_in_public_schema),
  jsonb_agg(jsonb_build_object('trigger_name', 'user_geo_marks_normalize_state_trigger', 'exists', exists_in_public_schema))
from trigger_status
union all
select
  'summary_no_rows_after_042',
  row_count = 0,
  jsonb_build_array(jsonb_build_object('row_count', row_count))
from row_counts
union all
select
  'summary_spots_population_unchanged_from_405',
  spots_total = 313 and spots_visible = 304,
  jsonb_build_array(
    jsonb_build_object('spots_total', spots_total, 'spots_visible', spots_visible)
  )
from spots_counts
order by check_name;
