# 406 — Geo core tables migration prepared

**Fecha:** 2026-04-28
**Rama:** `codex/geo-core-tables-migration`
**OL relacionado:** `OL-DATA-MODEL-INTROSPECTION-001`, `OL-GEO-CANON-001`

## Contexto

Tras el diagnóstico remoto read-only registrado en la bitácora `405`, no existen tablas `geo_*` en Supabase remoto y hay evidencia de países/ciudades/regiones guardadas históricamente como `spots`. Esto confirma que Flowya necesita identidad territorial canónica antes de conectar Search/GeoSheet o hacer cleanup de geo-like spots.

## Decisión

Preparar la migración `040` como DDL aditivo versionado en repo, sin aplicarla en remoto dentro de este PR.

La migración agrega:

- `geo_countries`
- `geo_regions`
- `geo_cities`
- `geo_aliases`
- `geo_external_refs`
- RLS con lectura pública solo de metadata activa
- triggers `updated_at`
- checks básicos de formato, coordenadas y confianza
- índices para lookup por alias y referencias externas

## Alcance excluido

- No seed inicial.
- No backfill.
- No cambios en `spots`.
- No cambios en `pins`.
- No cleanup ni hard delete.
- No Storage API.
- No aplicación remota.

## Riesgos controlados

- `geo_aliases.entity_id` y `geo_external_refs.entity_id` son polimórficos y no tienen FK directa. Se documenta que la integridad queda bajo tooling/admin curado hasta que el volumen justifique tablas separadas por entidad.
- `geo_areas` no se crea en `040`; se mantiene como tipo futuro para no cerrar la puerta a zonas/barrios/islas sin convertirlas en `spots`.
- Search/GeoSheet no debe consumir `geo_*` hasta que existan al menos `040` aplicado, seed `041` aprobado y decisión sobre `user_geo_marks`.

## Rollback

Si la migración aún no ha sido consumida por runtime/datos de usuario:

```sql
drop table if exists public.geo_external_refs;
drop table if exists public.geo_aliases;
drop table if exists public.geo_cities;
drop table if exists public.geo_regions;
drop table if exists public.geo_countries;
drop function if exists public.geo_set_updated_at();
```

Si ya fue consumida, no hacer drop directo: usar `is_active=false` y migración correctiva.

## Próximo paso recomendado

Aplicar y verificar `040` en Supabase remoto con aprobación explícita. Después preparar `041` con seed mínimo aprobado, no mundial, para casos QA: México, Estados Unidos, Costa Rica, Panamá, Quintana Roo, Yucatán, Mérida, Holbox/Isla Holbox y San José con desambiguación.
