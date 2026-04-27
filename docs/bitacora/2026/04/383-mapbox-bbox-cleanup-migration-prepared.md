# 383 — Mapbox bbox cleanup migration prepared

Fecha: 2026-04-26

## Contexto

La introspección confirmó `mapbox_bbox` incoherentes en spots reales. El runtime ya protege cámara y escritura, pero el dato remoto sigue conteniendo metadata derivada contaminada. Para cerrar el P0 de forma estable hace falta un backfill no destructivo y revisable.

## Cambio preparado

Se creó la migración:

- `supabase/migrations/034_spots_invalid_mapbox_bbox_cleanup.sql`

La migración:

- crea `public.spots_mapbox_bbox_cleanup_034_backup`;
- habilita RLS en la tabla de backup y no agrega policies públicas;
- guarda `spot_id`, `old_mapbox_bbox`, `old_mapbox_feature_type`, `reason`;
- limpia únicamente `mapbox_bbox` y `mapbox_feature_type` cuando el bbox:
  - está mal formado;
  - está fuera de límites del mundo;
  - está invertido/vacío;
  - no contiene `latitude/longitude` del spot.

## Aplicación remota

- Precheck remoto por CLI antes de aplicar: 115 spots con `mapbox_bbox`, 17 inválidos.
- Producto autorizó aplicar el backfill.
- `034_spots_invalid_mapbox_bbox_cleanup.sql` fue ejecutada vía Supabase SQL Editor/CLI en remoto el 2026-04-26.
- La ejecución respondió OK sin filas de salida.
- Verificación posterior por SQL Editor confirmada por producto:
  - `backup_rows`: 17.
  - `remaining_with_bbox`: 98.
  - `remaining_invalid_bbox`: 0.

## Contrato actualizado

- `docs/contracts/MAP_FRAMING_UX.md`

Nuevo invariant: `mapbox_bbox` solo puede controlar cámara si es finito y contiene el punto real del spot/lugar; si no, gana el punto o se repara por flujo explícito.

## Validación requerida antes de aplicar

1. Confirmar conteo previo de filas candidatas.
2. Ejecutar migración en ambiente objetivo.
3. Confirmar que `spots_mapbox_bbox_cleanup_034_backup` contiene las filas tocadas.
4. Confirmar conteo posterior de bbox inválidos = 0.
5. QA: La Plancha/Mérida, spots con bbox europeo, Panamá/Chiquilá.

Estado:

- 1 a 4 completados.
- 5 pendiente de QA visual/manual en Explore.

## Rollback manual

La migración incluye comentario con SQL de rollback manual usando la tabla de backup.
