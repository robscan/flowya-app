# 407 — Geo core postmigration verifier

**Fecha:** 2026-04-28
**Rama:** `codex/geo-core-postmigration-verify`
**OL relacionado:** `OL-DATA-MODEL-INTROSPECTION-001`, `OL-GEO-CANON-001`

## Contexto

La migración `040_geo_core_tables.sql` ya quedó versionada en repo y mergeada, pero no aplicada en Supabase remoto. Antes de aplicar cambios de esquema en remoto conviene tener el verificador listo para cerrar evidencia inmediatamente después.

## Decisión

Agregar [`GEO_CORE_TABLES_POSTMIGRATION_VERIFY_2026-04-28.sql`](../../ops/GEO_CORE_TABLES_POSTMIGRATION_VERIFY_2026-04-28.sql) como SQL read-only post-migración.

El verificador confirma:

- presencia de las cinco tablas `geo_*`;
- RLS habilitado;
- políticas de lectura activa;
- índices y guards de unicidad;
- triggers `updated_at`;
- contrato de columnas;
- row counts esperados sin seed;
- conteo sanity de `spots` para comprobar que `040` no cambia población de lugares.

## Alcance excluido

- No aplica `040`.
- No hace seed.
- No toca `spots`, `pins`, RLS existente ni Storage.

## Próximo paso recomendado

Con aprobación explícita, aplicar `040` en Supabase remoto, correr este verificador, guardar resultados resumidos en bitácora y solo después preparar/aprobar seed `041`.
