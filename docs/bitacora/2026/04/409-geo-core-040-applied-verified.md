# 409 — Geo core 040 applied and verified

**Fecha:** 2026-04-28
**Rama:** `codex/apply-geo-core-040`
**OL relacionado:** `OL-DATA-MODEL-INTROSPECTION-001`, `OL-GEO-CANON-001`

## Contexto

Producto autorizo aplicar `040_geo_core_tables.sql` en Supabase remoto. El alcance aprobado era solo DDL aditivo para identidad geo canonica, sin seed, backfill, cleanup, cambios en `spots`, RLS existente ni Storage.

## Precheck

Se verifico en remoto que no existian estas tablas antes de aplicar:

- `geo_countries`
- `geo_regions`
- `geo_cities`
- `geo_aliases`
- `geo_external_refs`

Resultado: `exists_in_public_schema=false` para las cinco.

## Aplicacion

`supabase db push --dry-run` no se uso para aplicar porque reporto que intentaria empujar `001`-`040`; esto indica que el historial remoto de migraciones no esta reconciliado con los archivos locales.

Decision segura:

- aplicar solo `supabase/migrations/040_geo_core_tables.sql` via `npx supabase db query --linked --file ...`;
- no ejecutar `db push`;
- documentar que `db push` queda bloqueado hasta reconciliar historial de migraciones.

## Verificacion post-migracion

Se corrio [`GEO_CORE_TABLES_POSTMIGRATION_VERIFY_2026-04-28.sql`](../../ops/GEO_CORE_TABLES_POSTMIGRATION_VERIFY_2026-04-28.sql) con resumen final CLI-friendly.

Resultado: todos los checks pasaron.

| Check | Resultado |
|---|---|
| Tablas existen + RLS activo | `passed=true` |
| Policies active-read | `passed=true` |
| Indices requeridos | `passed=true` |
| Triggers `updated_at` | `passed=true` |
| Sin seed rows despues de `040` | `passed=true` |
| `spots` sin cambio vs bitacora `405` | `313` total / `304` visibles |

## Estado remoto

Quedan creadas en Supabase remoto:

- `public.geo_countries`
- `public.geo_regions`
- `public.geo_cities`
- `public.geo_aliases`
- `public.geo_external_refs`

Con:

- RLS habilitado;
- lectura publica solo para metadata activa;
- indices de lookup/unicidad;
- triggers `updated_at`;
- cero filas seed.

## Riesgo / guardrail nuevo

No usar `supabase db push` en este proyecto hasta reconciliar historial remoto de migraciones. El dry-run mostro que intentaria aplicar todas las migraciones locales, no solo las pendientes reales.

Si se decide reparar historial, debe ser un micro-scope separado:

- read-only inventory de `supabase_migrations.schema_migrations`;
- comparar con estado real;
- plan de `supabase migration repair` o equivalente;
- no ejecutar repair masivo sin aprobacion.

## Rollback

Mientras no exista consumo runtime ni datos usuario en `geo_*`, rollback posible:

```sql
drop table if exists public.geo_external_refs;
drop table if exists public.geo_aliases;
drop table if exists public.geo_cities;
drop table if exists public.geo_regions;
drop table if exists public.geo_countries;
drop function if exists public.geo_set_updated_at();
```

Si ya hay seed/runtime, no hacer drop directo; usar `is_active=false` o migracion correctiva.

## Proximo paso recomendado

Preparar `041` seed minimo, aprobado y pequeno, para casos QA geo. No seed mundial.
