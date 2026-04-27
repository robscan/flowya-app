# SUPABASE_INTROSPECTION_SQL

**Objetivo:** obtener evidencia de solo lectura del estado real de Supabase antes de cerrar el plan final V1, nuevas columnas en `spots`, canon media o contexto país/región/ciudad.

**Uso:** ejecutar por bloques en Supabase SQL Editor del ambiente objetivo. Copiar resultados como CSV/JSON o screenshots legibles. No requiere service role si se ejecuta desde SQL Editor con permisos de owner/admin.

**Importante:** copia solo el contenido SQL dentro de cada bloque, nunca las líneas Markdown `````sql` ni `````; el SQL Editor fallará si recibe esos delimitadores.

**No incluir en reportes públicos:** emails, tokens, provider ids o datos personales. Las muestras de abajo anonimizan `user_id` con `md5`.

---

## 1. Identidad del ambiente

```sql
select
  current_database() as database_name,
  current_user as sql_user,
  current_setting('server_version') as postgres_version,
  now() as inspected_at;
```

---

## 2. Tablas públicas y RLS

```sql
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relkind as rel_kind,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced,
  obj_description(c.oid, 'pg_class') as table_comment
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind in ('r', 'p', 'v', 'm')
order by c.relkind, c.relname;
```

---

## 3. Columnas críticas

```sql
select
  c.table_schema,
  c.table_name,
  c.ordinal_position,
  c.column_name,
  c.data_type,
  c.udt_name,
  c.is_nullable,
  c.column_default,
  c.character_maximum_length,
  c.numeric_precision,
  c.numeric_scale,
  c.datetime_precision
from information_schema.columns c
where c.table_schema = 'public'
  and c.table_name in (
    'spots',
    'pins',
    'profiles',
    'spot_images',
    'spot_personal_images',
    'user_tags',
    'pin_tags',
    'feedback'
  )
order by c.table_name, c.ordinal_position;
```

---

## 4. Constraints

```sql
select
  tc.table_schema,
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_schema as foreign_table_schema,
  ccu.table_name as foreign_table_name,
  ccu.column_name as foreign_column_name,
  rc.update_rule,
  rc.delete_rule,
  pg_get_constraintdef(con.oid) as constraint_definition
from information_schema.table_constraints tc
left join information_schema.key_column_usage kcu
  on tc.constraint_catalog = kcu.constraint_catalog
  and tc.constraint_schema = kcu.constraint_schema
  and tc.constraint_name = kcu.constraint_name
left join information_schema.constraint_column_usage ccu
  on tc.constraint_catalog = ccu.constraint_catalog
  and tc.constraint_schema = ccu.constraint_schema
  and tc.constraint_name = ccu.constraint_name
left join information_schema.referential_constraints rc
  on tc.constraint_catalog = rc.constraint_catalog
  and tc.constraint_schema = rc.constraint_schema
  and tc.constraint_name = rc.constraint_name
left join pg_constraint con
  on con.conname = tc.constraint_name
where tc.table_schema = 'public'
  and tc.table_name in (
    'spots',
    'pins',
    'profiles',
    'spot_images',
    'spot_personal_images',
    'user_tags',
    'pin_tags',
    'feedback'
  )
order by tc.table_name, tc.constraint_type, tc.constraint_name, kcu.ordinal_position;
```

---

## 5. Índices

```sql
select
  schemaname,
  tablename,
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and tablename in (
    'spots',
    'pins',
    'profiles',
    'spot_images',
    'spot_personal_images',
    'user_tags',
    'pin_tags',
    'feedback'
  )
order by tablename, indexname;
```

---

## 6. Policies RLS

```sql
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname in ('public', 'storage')
order by schemaname, tablename, cmd, policyname;
```

---

## 7. Grants

```sql
select
  table_schema,
  table_name,
  grantee,
  privilege_type,
  is_grantable
from information_schema.role_table_grants
where table_schema in ('public', 'storage')
  and grantee in ('anon', 'authenticated', 'service_role', 'public')
order by table_schema, table_name, grantee, privilege_type;
```

---

## 8. Triggers

```sql
select
  event_object_schema,
  event_object_table,
  trigger_name,
  action_timing,
  event_manipulation,
  action_orientation,
  action_statement
from information_schema.triggers
where event_object_schema = 'public'
order by event_object_table, trigger_name, event_manipulation;
```

---

## 9. Funciones/RPC públicas

```sql
select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as result_type,
  l.lanname as language,
  p.prosecdef as security_definer,
  p.provolatile as volatility,
  pg_get_functiondef(p.oid) as function_definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
join pg_language l on l.oid = p.prolang
where n.nspname = 'public'
order by p.proname, arguments;
```

---

## 10. Storage buckets

```sql
select
  id,
  name,
  owner,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at,
  updated_at
from storage.buckets
order by id;
```

---

## 11. Storage objects por bucket

```sql
select
  bucket_id,
  count(*) as object_count,
  sum(coalesce((metadata->>'size')::bigint, 0)) as total_bytes,
  min(created_at) as first_object_at,
  max(created_at) as last_object_at
from storage.objects
group by bucket_id
order by bucket_id;
```

```sql
select
  bucket_id,
  name,
  owner,
  metadata->>'mimetype' as mimetype,
  coalesce((metadata->>'size')::bigint, 0) as size_bytes,
  created_at,
  updated_at,
  last_accessed_at
from storage.objects
where bucket_id in ('spot-covers', 'spot-personal', 'profile-avatars')
order by bucket_id, created_at desc
limit 80;
```

---

## 12. Conteos por tabla crítica

```sql
select 'spots' as table_name, count(*)::bigint as row_count from public.spots
union all select 'pins', count(*)::bigint from public.pins
union all select 'profiles', count(*)::bigint from public.profiles
union all select 'spot_images', count(*)::bigint from public.spot_images
union all select 'spot_personal_images', count(*)::bigint from public.spot_personal_images
union all select 'user_tags', count(*)::bigint from public.user_tags
union all select 'pin_tags', count(*)::bigint from public.pin_tags
union all select 'feedback', count(*)::bigint from public.feedback
order by table_name;
```

---

## 13. Muestra anónima de spots

```sql
select
  id,
  md5(coalesce(user_id::text, 'null')) as user_hash,
  to_jsonb(spots) - 'user_id' as spot_row
from public.spots
order by created_at desc
limit 30;
```

---

## 14. Calidad de coordenadas y bbox

```sql
select
  count(*) filter (where latitude is null or longitude is null) as missing_coords,
  count(*) filter (where latitude < -90 or latitude > 90 or longitude < -180 or longitude > 180) as invalid_coords,
  count(*) filter (where mapbox_bbox is not null) as spots_with_bbox,
  count(*) filter (
    where mapbox_bbox is not null
      and jsonb_typeof(mapbox_bbox) = 'array'
      and jsonb_array_length(mapbox_bbox) = 4
  ) as spots_with_bbox_array4,
  count(*) filter (
    where mapbox_bbox is not null
      and jsonb_typeof(mapbox_bbox) = 'object'
      and mapbox_bbox ? 'west'
      and mapbox_bbox ? 'east'
      and mapbox_bbox ? 'south'
      and mapbox_bbox ? 'north'
  ) as spots_with_bbox_object
from public.spots;
```

```sql
select
  id,
  title,
  latitude,
  longitude,
  mapbox_feature_type,
  mapbox_bbox
from public.spots
where mapbox_bbox is not null
order by updated_at desc nulls last, created_at desc
limit 50;
```

```sql
select
  count(*) as bbox_object_total,
  count(*) filter (
    where longitude between least((mapbox_bbox->>'west')::double precision, (mapbox_bbox->>'east')::double precision)
                        and greatest((mapbox_bbox->>'west')::double precision, (mapbox_bbox->>'east')::double precision)
      and latitude between least((mapbox_bbox->>'south')::double precision, (mapbox_bbox->>'north')::double precision)
                       and greatest((mapbox_bbox->>'south')::double precision, (mapbox_bbox->>'north')::double precision)
  ) as bbox_contains_point,
  count(*) filter (
    where not (
      longitude between least((mapbox_bbox->>'west')::double precision, (mapbox_bbox->>'east')::double precision)
                          and greatest((mapbox_bbox->>'west')::double precision, (mapbox_bbox->>'east')::double precision)
      and latitude between least((mapbox_bbox->>'south')::double precision, (mapbox_bbox->>'north')::double precision)
                       and greatest((mapbox_bbox->>'south')::double precision, (mapbox_bbox->>'north')::double precision)
    )
  ) as bbox_does_not_contain_point
from public.spots
where mapbox_bbox is not null
  and jsonb_typeof(mapbox_bbox) = 'object'
  and mapbox_bbox ? 'west'
  and mapbox_bbox ? 'east'
  and mapbox_bbox ? 'south'
  and mapbox_bbox ? 'north';
```

```sql
select
  id,
  title,
  latitude,
  longitude,
  mapbox_feature_type,
  mapbox_bbox
from public.spots
where mapbox_bbox is not null
  and jsonb_typeof(mapbox_bbox) = 'object'
  and mapbox_bbox ? 'west'
  and mapbox_bbox ? 'east'
  and mapbox_bbox ? 'south'
  and mapbox_bbox ? 'north'
  and not (
    longitude between least((mapbox_bbox->>'west')::double precision, (mapbox_bbox->>'east')::double precision)
                        and greatest((mapbox_bbox->>'west')::double precision, (mapbox_bbox->>'east')::double precision)
    and latitude between least((mapbox_bbox->>'south')::double precision, (mapbox_bbox->>'north')::double precision)
                     and greatest((mapbox_bbox->>'south')::double precision, (mapbox_bbox->>'north')::double precision)
  )
order by updated_at desc nulls last, created_at desc
limit 80;
```

---

## 15. Media pública: URL vs path

```sql
select
  count(*) as total,
  count(*) filter (where url like 'http%') as full_url_count,
  count(*) filter (where url not like 'http%') as path_like_count,
  count(*) filter (where url like '%/storage/v1/object/public/%') as supabase_public_url_count
from public.spot_images;
```

```sql
select
  id,
  spot_id,
  url,
  sort_order,
  created_at
from public.spot_images
order by created_at desc
limit 40;
```

---

## 16. Media personal privada

```sql
select
  count(*) as total,
  count(*) filter (where storage_path like 'http%') as path_is_full_url_count,
  count(*) filter (where storage_path not like 'http%') as path_count
from public.spot_personal_images;
```

```sql
select
  id,
  spot_id,
  md5(coalesce(user_id::text, 'null')) as user_hash,
  storage_path,
  sort_order,
  created_at
from public.spot_personal_images
order by created_at desc
limit 40;
```

---

## 17. Pins, estados y consistencia owner

```sql
select
  count(*) as total_pins,
  count(*) filter (where saved = true) as saved_count,
  count(*) filter (where visited = true) as visited_count,
  count(*) filter (where saved = true and visited = true) as saved_and_visited_count,
  count(*) filter (where spot_id is null) as missing_spot_id
from public.pins;
```

```sql
select
  p.id,
  p.spot_id,
  md5(coalesce(p.user_id::text, 'null')) as pin_user_hash,
  md5(coalesce(s.user_id::text, 'null')) as spot_user_hash,
  p.saved,
  p.visited,
  p.created_at
from public.pins p
left join public.spots s on s.id = p.spot_id
order by p.created_at desc
limit 50;
```

---

## 18. Tags

```sql
select
  count(*) as user_tags_count,
  count(distinct user_id) as tag_owner_count
from public.user_tags;
```

```sql
select
  count(*) as pin_tags_count,
  count(distinct tag_id) as used_tag_count,
  count(distinct spot_id) as tagged_spot_count
from public.pin_tags;
```

```sql
select
  t.id,
  md5(coalesce(t.user_id::text, 'null')) as user_hash,
  t.name,
  t.slug,
  t.created_at,
  count(pt.spot_id) as assignment_count
from public.user_tags t
left join public.pin_tags pt on pt.tag_id = t.id
group by t.id, t.user_id, t.name, t.slug, t.created_at
order by assignment_count desc, t.created_at desc
limit 50;
```

---

## 19. Profiles sin datos personales directos

```sql
select
  id,
  md5(id::text) as user_hash,
  to_jsonb(profiles) - 'id' - 'email' as profile_row
from public.profiles
order by updated_at desc nulls last, created_at desc
limit 30;
```

---

## 20. Búsqueda de columnas geográficas/media existentes

```sql
select
  table_schema,
  table_name,
  column_name,
  data_type,
  udt_name,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and (
    column_name ilike '%country%'
    or column_name ilike '%region%'
    or column_name ilike '%city%'
    or column_name ilike '%bbox%'
    or column_name ilike '%mapbox%'
    or column_name ilike '%maki%'
    or column_name ilike '%image%'
    or column_name ilike '%storage%'
    or column_name ilike '%visibility%'
  )
order by table_name, ordinal_position;
```

---

## 21. Extensiones relevantes

```sql
select
  extname,
  extversion,
  n.nspname as schema_name
from pg_extension e
join pg_namespace n on n.oid = e.extnamespace
where extname in ('postgis', 'pg_trgm', 'uuid-ossp', 'pgcrypto', 'vector')
order by extname;
```

---

## 22. Migraciones registradas por Supabase

```sql
select
  table_schema,
  table_name
from information_schema.tables
where table_schema = 'supabase_migrations'
   or table_name ilike '%migration%'
order by table_schema, table_name;
```

Si el resultado no muestra ninguna tabla de migraciones visible, no es bloqueante para el plan: usar `supabase/migrations/*` del repo + la introspección real como matriz de drift.
