# 390 — Data model current + plan media/geo V1

Fecha: 2026-04-26

## Cambio

- `DATA_MODEL_CURRENT.md` se reemplaza por un contrato vigente basado en la introspección Supabase 2026-04-26.
- Se documentan tablas reales críticas: `spots`, `pins`, `profiles`, `spot_images`, `spot_personal_images`, `user_tags`, `pin_tags`, `feedback`.
- Se explicitan gaps reales:
  - `spots` no tiene `country_code`, `region_code`, `city_name`, `coordinate_source`, `created_from`, `place_snapshot` ni `is_public`;
  - `pins` no tiene `updated_at`;
  - `spot_images` guarda URL pública completa y no tiene `storage_path`/metadata de media;
  - `spot_personal_images` está vacía y usa `storage_path`;
  - `spot-covers` tiene objetos no reconciliados.
- Se crea `PLAN_DATA_MODEL_MEDIA_GEO_V1_2026-04-26.md` para convertir la introspección en micro-scopes seguros.
- `OPEN_LOOPS.md` queda sincronizado con el contrato actualizado y el plan resultante.

## Criterio

`spots` no debe absorber información territorial pesada. Para V1, los campos nuevos deben limitarse a datos calientes y estables. Visa, transporte, salud, dinero, clima y emergencias deben vivir en tablas de contexto país/región/ciudad, preferentemente cargadas por lotes y versionadas.

## Decisiones documentadas

- Supabase Storage sigue siendo proveedor V1.
- Media pública debe migrar a path-first con compatibilidad legacy.
- `spot-personal` no debe exponerse públicamente.
- No limpiar objetos Storage sin inventario.
- No aplicar `034` ni nuevas migraciones DB como parte de este cierre documental.

## Pendiente

- Decidir si se aplica `034_spots_invalid_mapbox_bbox_cleanup.sql`.
- Inventariar 29 objetos de `spot-covers` no reconciliados.
- Diseñar migración media path-first.
- Decidir campos mínimos de `spots` para `coordinate_source`, `created_from` y geografía básica.
- Decidir si `place_snapshot` vive en `spots` como JSONB o en tabla relacionada.
