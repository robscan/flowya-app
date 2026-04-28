# PLAN_GEO_CANON_MIGRATIONS_V1

**Fecha:** 2026-04-28
**Estado:** plan pre-migracion; no aplicar sin evidencia SQL y VoBo explicito
**Base:** [`GEO_IDENTITY_DEDUP_V1.md`](../../contracts/GEO_IDENTITY_DEDUP_V1.md), [`DATA_MODEL_CURRENT.md`](../../contracts/DATA_MODEL_CURRENT.md), [`GEO_IDENTITY_PREMIGRATION_DIAGNOSTIC_2026-04-28.sql`](../GEO_IDENTITY_PREMIGRATION_DIAGNOSTIC_2026-04-28.sql)

---

## Objetivo

Preparar el modelo geo canonico sin repetir el error de crear paises, regiones o ciudades como `spots`.

Este plan define la secuencia exacta de migraciones futuras, sus prechecks, rollback y criterios de no-go. No aplica cambios remotos por si mismo.

---

## Decision ejecutiva

1. `geo_*` sera la fuente de verdad territorial.
2. `spots` conserva lugares puntuales/POI y podra enlazar contexto geo.
3. `pins` conserva relacion usuario-spot.
4. `user_geo_marks` sera relacion usuario-geo.
5. `country_code`, `region_code`, `city_name` no se agregan como fuente de verdad. Si aparecen despues, seran cache derivado y sincronizado desde `geo_*`.

---

## Precondiciones obligatorias

Antes de crear una migracion real:

1. Ejecutar [`GEO_IDENTITY_PREMIGRATION_DIAGNOSTIC_2026-04-28.sql`](../GEO_IDENTITY_PREMIGRATION_DIAGNOSTIC_2026-04-28.sql) en remoto.
2. Guardar resumen de resultados en bitacora.
3. Confirmar si ya existen tablas `geo_*`.
4. Revisar manualmente:
   - spots con metadata `country|region|place|locality`;
   - duplicados por `linked_place_id`;
   - duplicados por titulo;
   - casos semilla `Mexico`, `Quintana Roo`, `Holbox`, `Merida`, `San Jose`, `Georgia`.
5. Producto debe decidir si `geo_areas` entra en V1 o se difiere.

No-go:

- ejecutar seeds masivos sin fuente/licencia;
- crear `geo_*` sin RLS;
- migrar/ocultar spots geo-like sin backup;
- hard delete;
- convertir `address` en identidad;
- bloquear Search con un modelo incompleto.

---

## Migracion 040 — Geo core tables

Archivo futuro recomendado:

- `supabase/migrations/040_geo_core_tables.sql`

Alcance:

- `geo_countries`
- `geo_regions`
- `geo_cities`
- `geo_aliases`
- `geo_external_refs`
- RLS read-only publica para entidades activas
- sin seeds
- sin tocar `spots`

DDL conceptual:

```sql
begin;

create table if not exists public.geo_countries (
  id uuid primary key default gen_random_uuid(),
  iso2 text not null,
  iso3 text,
  name_es text not null,
  name_en text not null,
  slug text not null,
  centroid_latitude double precision,
  centroid_longitude double precision,
  bbox jsonb,
  source text not null default 'flowya_curated',
  source_updated_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint geo_countries_iso2_unique unique (iso2),
  constraint geo_countries_iso3_unique unique (iso3),
  constraint geo_countries_slug_unique unique (slug),
  constraint geo_countries_iso2_format check (iso2 ~ '^[A-Z]{2}$'),
  constraint geo_countries_iso3_format check (iso3 is null or iso3 ~ '^[A-Z]{3}$')
);

create table if not exists public.geo_regions (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references public.geo_countries(id) on delete restrict,
  region_code text,
  name_es text not null,
  name_en text not null,
  slug text not null,
  region_type text not null default 'region',
  centroid_latitude double precision,
  centroid_longitude double precision,
  bbox jsonb,
  source text not null default 'flowya_curated',
  source_updated_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint geo_regions_country_code_unique unique (country_id, region_code),
  constraint geo_regions_country_slug_unique unique (country_id, slug),
  constraint geo_regions_region_type_check check (region_type in ('state', 'province', 'region', 'district', 'territory', 'other'))
);

create table if not exists public.geo_cities (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references public.geo_countries(id) on delete restrict,
  region_id uuid references public.geo_regions(id) on delete restrict,
  official_name text not null,
  name_es text not null,
  name_en text not null,
  slug text not null,
  city_type text not null default 'city',
  centroid_latitude double precision,
  centroid_longitude double precision,
  bbox jsonb,
  population_bucket text,
  source text not null default 'flowya_curated',
  source_updated_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint geo_cities_city_type_check check (city_type in ('city', 'town', 'village', 'locality', 'island_town', 'other'))
);

create unique index if not exists geo_cities_country_region_slug_unique
  on public.geo_cities(country_id, coalesce(region_id, '00000000-0000-0000-0000-000000000000'::uuid), slug);

create table if not exists public.geo_aliases (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  locale text,
  name text not null,
  normalized_name text not null,
  source text not null default 'flowya_curated',
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  constraint geo_aliases_entity_type_check check (entity_type in ('country', 'region', 'city', 'area')),
  constraint geo_aliases_unique unique (entity_type, entity_id, locale, normalized_name)
);

create table if not exists public.geo_external_refs (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  provider text not null,
  provider_ref text not null,
  provider_kind text,
  confidence numeric,
  source_updated_at timestamptz,
  created_at timestamptz not null default now(),
  constraint geo_external_refs_entity_type_check check (entity_type in ('country', 'region', 'city', 'area')),
  constraint geo_external_refs_unique unique (provider, provider_ref, entity_type)
);

alter table public.geo_countries enable row level security;
alter table public.geo_regions enable row level security;
alter table public.geo_cities enable row level security;
alter table public.geo_aliases enable row level security;
alter table public.geo_external_refs enable row level security;

create policy geo_countries_select_active on public.geo_countries
  for select using (is_active = true);
create policy geo_regions_select_active on public.geo_regions
  for select using (is_active = true);
create policy geo_cities_select_active on public.geo_cities
  for select using (is_active = true);
create policy geo_aliases_select on public.geo_aliases
  for select using (true);
create policy geo_external_refs_select on public.geo_external_refs
  for select using (true);

commit;
```

Nota:

- `geo_aliases.entity_id` y `geo_external_refs.entity_id` no pueden tener FK polimorfico real. La integridad debe vigilarse por RPC/admin tooling o separarse por tablas si crece la complejidad.
- Si producto exige FK estricta desde el dia 1, dividir en `geo_country_aliases`, `geo_region_aliases`, etc.

Rollback:

```sql
begin;
drop table if exists public.geo_external_refs;
drop table if exists public.geo_aliases;
drop table if exists public.geo_cities;
drop table if exists public.geo_regions;
drop table if exists public.geo_countries;
commit;
```

---

## Migracion 041 — Seed geo inicial controlado

Archivo futuro recomendado:

- `supabase/migrations/041_geo_seed_initial_scope.sql`

Alcance:

- seed minimo para probar Search/GeoSheet sin cargar el mundo completo;
- paises/regiones/ciudades necesarios para casos actuales y QA.

Seed inicial sugerido:

| Tipo | Entidad | Motivo |
|---|---|---|
| Pais | Mexico | Base actual de datos y QA |
| Pais | United States | Caso de mapa/smoke y ambiguedad |
| Pais | Costa Rica | Datos existentes probables |
| Pais | Panama | Datos existentes probables |
| Region | Quintana Roo | Holbox |
| Region | Yucatan | Merida |
| Ciudad/area | Merida | Caso QA Search |
| Ciudad/area | Holbox / Isla Holbox | Caso reportado por producto |
| Ciudad | San Jose | Ambiguedad internacional |

Reglas:

- seed idempotente por llaves naturales;
- incluir aliases basicos ES/EN;
- incluir refs externas solo si son verificadas y estables;
- no usar Mapbox fallback synthetic ids como refs fuertes.

Rollback:

- borrar solo filas seed por `source='flowya_seed_041'` si no tienen relaciones.
- si ya hay relaciones, desactivar con `is_active=false` y documentar.

---

## Migracion 042 — `user_geo_marks`

Archivo futuro recomendado:

- `supabase/migrations/042_user_geo_marks.sql`

Alcance:

- relacion usuario-geo owner-only;
- no publicar progreso geo privado por tabla directa;
- estados exclusivos como `pins`.

DDL conceptual:

```sql
begin;

create table if not exists public.user_geo_marks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  saved boolean not null default false,
  visited boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_geo_marks_entity_type_check check (entity_type in ('country', 'region', 'city', 'area')),
  constraint user_geo_marks_user_entity_unique unique (user_id, entity_type, entity_id),
  constraint user_geo_marks_has_state check (saved = true or visited = true)
);

create index if not exists user_geo_marks_user_idx
  on public.user_geo_marks(user_id);

create index if not exists user_geo_marks_entity_idx
  on public.user_geo_marks(entity_type, entity_id);

alter table public.user_geo_marks enable row level security;

create policy user_geo_marks_select_own on public.user_geo_marks
  for select to authenticated
  using (auth.uid() = user_id);

create policy user_geo_marks_insert_own on public.user_geo_marks
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy user_geo_marks_update_own on public.user_geo_marks
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy user_geo_marks_delete_own on public.user_geo_marks
  for delete to authenticated
  using (auth.uid() = user_id);

commit;
```

Follow-up recomendado:

- trigger equivalente a pins: si `visited=true`, entonces `saved=false`;
- trigger `updated_at`;
- RPC publico agregado/k-anonimo solo si Passport/share lo necesita.

Rollback:

- si no hay uso productivo: `drop table public.user_geo_marks`;
- si ya hay uso: backup JSON por usuario antes de drop o mantener tabla y retirar consumidores.

---

## Migracion 043 — Enlaces spot-geo y procedencia

Archivo futuro recomendado:

- `supabase/migrations/043_spots_geo_links_and_provenance.sql`

Alcance:

- agregar procedencia de creacion/coordenada;
- agregar FKs geo opcionales;
- no backfill masivo automatico en el mismo PR salvo muestra verificada.

DDL conceptual:

```sql
begin;

alter table public.spots
  add column if not exists coordinate_source text,
  add column if not exists created_from text,
  add column if not exists geo_country_id uuid references public.geo_countries(id) on delete set null,
  add column if not exists geo_region_id uuid references public.geo_regions(id) on delete set null,
  add column if not exists geo_city_id uuid references public.geo_cities(id) on delete set null,
  add column if not exists geo_resolution_status text not null default 'unresolved',
  add column if not exists geo_resolved_at timestamptz;

alter table public.spots
  add constraint spots_coordinate_source_check
  check (
    coordinate_source is null
    or coordinate_source in ('map_tap', 'search_result', 'edit_manual', 'photo_exif', 'import', 'unknown')
  );

alter table public.spots
  add constraint spots_created_from_check
  check (
    created_from is null
    or created_from in ('map', 'search', 'poi', 'photo', 'manual', 'import', 'unknown')
  );

alter table public.spots
  add constraint spots_geo_resolution_status_check
  check (geo_resolution_status in ('resolved', 'unresolved', 'ambiguous', 'manual_review'));

create index if not exists spots_geo_country_idx on public.spots(geo_country_id);
create index if not exists spots_geo_region_idx on public.spots(geo_region_id);
create index if not exists spots_geo_city_idx on public.spots(geo_city_id);
create index if not exists spots_geo_resolution_status_idx on public.spots(geo_resolution_status);

comment on column public.spots.coordinate_source is
  'How the spot coordinates were obtained. Does not define geo identity.';
comment on column public.spots.created_from is
  'User/runtime flow that created the spot.';
comment on column public.spots.geo_country_id is
  'Derived link to geo_countries. geo_* remains source of truth.';
comment on column public.spots.geo_resolution_status is
  'Resolution state for spot -> geo_* links.';

commit;
```

Rollback:

```sql
begin;
alter table public.spots drop constraint if exists spots_geo_resolution_status_check;
alter table public.spots drop constraint if exists spots_created_from_check;
alter table public.spots drop constraint if exists spots_coordinate_source_check;
drop index if exists spots_geo_resolution_status_idx;
drop index if exists spots_geo_city_idx;
drop index if exists spots_geo_region_idx;
drop index if exists spots_geo_country_idx;
alter table public.spots
  drop column if exists geo_resolved_at,
  drop column if exists geo_resolution_status,
  drop column if exists geo_city_id,
  drop column if exists geo_region_id,
  drop column if exists geo_country_id,
  drop column if exists created_from,
  drop column if exists coordinate_source;
commit;
```

---

## Migracion 044 — Backfill auditado spot-geo

Archivo futuro recomendado:

- `supabase/migrations/044_spots_geo_backfill_reviewed.sql`

Alcance:

- crear tabla backup antes de actualizar spots;
- backfill solo para matches no ambiguos;
- dejar ambiguos en `manual_review`.

Reglas:

- no ocultar ni borrar spots en esta migracion;
- no mover pins/media;
- no inferir ciudad por string de direccion sin confirmacion;
- guardar query/resultados del precheck en bitacora.

Backup conceptual:

```sql
create table if not exists public.spots_geo_backfill_044_backup as
select *
from public.spots
where false;
```

Rollback:

- restaurar columnas geo/procedencia desde backup para filas tocadas;
- si el backfill fallo masivamente, revertir commit DB con script inverso antes de conectar UI.

---

## Preguntas abiertas antes de aplicar

1. `geo_areas` entra en V1 o se difiere?
2. Holbox se modela como `city`, `area` o ambos con relacion?
3. Se usara Wikidata/GeoNames/OSM como fuente inicial estable?
4. Quien edita seeds canonicos: SQL versionado, panel admin o scripts internos?
5. Search V1 mostrara entidades geo aun si no hay `user_geo_marks`?

---

## Definition of Done para abrir migracion real

- Resultado del SQL diagnostico guardado.
- No-go revisados.
- Seed inicial aprobado.
- RLS definido por tabla.
- Rollback revisado.
- PR separado para migracion.
- PR separado para runtime Search/GeoSheet.
- QA manual definido para Mexico, Holbox, Merida, San Jose y Plaza Principal.
