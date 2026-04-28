# 404 — Pre-migracion geo: diagnostico y plan de migraciones

**Fecha:** 2026-04-28
**Tipo:** plan / SQL diagnostico / arquitectura de datos

## Contexto

Tras crear el contrato [`GEO_IDENTITY_DEDUP_V1.md`](../../../contracts/GEO_IDENTITY_DEDUP_V1.md), el siguiente paso seguro es preparar evidencia antes de cualquier DB change.

Producto quiere evitar que paises, regiones o ciudades se dupliquen o se creen como `spots`. La solucion requiere saber primero cuanto geo-like data existe hoy en `spots` y cual es el tamano real del backfill.

## Alcance

- Se agrega SQL read-only de diagnostico:
  - [`GEO_IDENTITY_PREMIGRATION_DIAGNOSTIC_2026-04-28.sql`](../../../ops/GEO_IDENTITY_PREMIGRATION_DIAGNOSTIC_2026-04-28.sql)
- Se agrega plan de migraciones futuras:
  - [`PLAN_GEO_CANON_MIGRATIONS_V1_2026-04-28.md`](../../../ops/plans/PLAN_GEO_CANON_MIGRATIONS_V1_2026-04-28.md)

## Decision

No se crean archivos en `supabase/migrations/` todavia.

Motivo:

- este bloque debe preparar diagnostico y diseno;
- crear una migracion versionada podria inducir aplicacion prematura;
- primero se debe correr el SQL read-only remoto, guardar resultados y aprobar seed/fases.

## Que mide el SQL

- presencia previa de tablas `geo_*`;
- distribucion de `spots` por `linked_place_kind` y `mapbox_feature_type`;
- spots geo-like por metadata de proveedor;
- duplicados visibles por `linked_place_id`;
- duplicados visibles por titulo normalizado;
- duplicados title+coordinate;
- casos semilla `Mexico`, `Quintana Roo`, `Holbox`, `Merida`, `San Jose`, `Georgia`;
- distribucion de cola de direccion como senal, no identidad;
- riesgo por relaciones `pins`, `pin_tags`, `spot_images`, `spot_personal_images`.

## Plan de migraciones futuras

- `040_geo_core_tables.sql`
- `041_geo_seed_initial_scope.sql`
- `042_user_geo_marks.sql`
- `043_spots_geo_links_and_provenance.sql`
- `044_spots_geo_backfill_reviewed.sql`

Cada una queda descrita con alcance, DDL conceptual, RLS, no-go y rollback.

## No tocado

- No DB remota.
- No migraciones Supabase.
- No RLS runtime.
- No Storage.
- No Search runtime.
- No GeoSheet runtime.
- No seeds.

## Riesgos

- Si se corre el plan sin diagnostico, puede sobrediseniar o migrar ambiguos.
- Si se conectan GeoSheets antes de `user_geo_marks`, se puede repetir duplicidad por usuario.
- Si se usa direccion como identidad, se hereda deuda.

## Pruebas

- `git diff --check`
- `npx tsc --noEmit`
- `npm run test:regression`

## Rollback

Revertir el PR. No hay rollback DB porque no se aplican migraciones ni scripts remotos.
