# 394 — Cierre jornada gate V1 data/media/map

Fecha: 2026-04-26

## Estado al parar

Se detiene la sesión en un punto seguro, sin operaciones destructivas pendientes en ejecución.

## Cerrado con evidencia

- `033_pins_remove_public_select.sql`: aplicado; lectura pública directa de `pins` removida.
- `034_spots_invalid_mapbox_bbox_cleanup.sql`: aplicado; `remaining_invalid_bbox=0`.
- `035_spot_images_path_first_metadata.sql`: aplicado; `spot_images` path-first con compatibilidad `url`.
- `036_seed_cover_only_spot_images.sql`: aplicado; `remaining_cover_only=0`.
- `037_pins_status_derived_guard.sql`: aplicado; trigger activo (`tgenabled=O`) y `drift_rows=0`.

## Implementado en runtime

- Guardrails de cámara/bbox para evitar encuadres a países incorrectos.
- Recuperación de intención de búsqueda V1 con scoring local parcial/fuzzy.
- Canon de densidad de listados Explore y selección como estado de `SearchListCard`.
- Canon path-first de galería pública con helper `getSpotImagePublicUrl()`.
- Normalización runtime de `pins.saved`/`pins.visited`.

## Diferido explícitamente

Cleanup de 29 candidatos huérfanos en `spot-covers`.

Motivo:

- Supabase bloquea borrado directo desde `storage.objects`.
- Debe retomarse con Storage API, service role temporal, `--dry-run` por defecto y respaldo previo.
- No guardar service role en `.env`.

Archivo preparado solo para backup/listado:

- `supabase/migrations/038_spot_covers_orphan_candidates_backup.sql`

## Siguiente OL / punto de retoma

Retomar en:

- `OL-DATA-MODEL-INTROSPECTION-001`

Siguiente decisión concreta:

- campos mínimos en `spots` para V1:
  - `coordinate_source`
  - `created_from`
  - `country_code`
  - `region_code`
  - `city_name`

Criterio:

- No meter visa/transporte/salud/dinero/clima/emergencias en `spots`.
- Diseñar contexto país/región/ciudad en tablas batch-first (`geo_*`) cuando se abra `OL-GEO-CONTEXT-BATCH-001`.

## Validación local

Últimas validaciones relevantes durante la sesión:

- `npx tsc --noEmit`
- `npm run test:regression`
- `git diff --check`
