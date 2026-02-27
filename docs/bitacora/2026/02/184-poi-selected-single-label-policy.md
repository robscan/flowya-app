# 184 — Política de label único en selección POI/overlay

**Fecha:** 2026-02-26  
**Rama:** `codex/next-search-map-iteration`

## Problema

Tras habilitar pin seleccionado canónico para POI/spot oculto, aparecía superposición de labels (Mapbox + label del overlay).

## Decisión de fondo

Adoptar política de **label único por entidad seleccionada**:
- Para overlays de selección (`poi` o `spot` oculto), mostrar solo el pin seleccionado.
- No renderizar label adicional en el overlay.
- El nombre se comunica por sheet y/o label nativo de mapa cuando exista.

## Cambio aplicado

- `components/explorar/MapScreenVNext.tsx`
  - `previewPinLabel` ahora solo se usa en flujos de draft/create spot.
  - En selección POI/overlay de selected spot oculto se fuerza `null` para evitar duplicidad visual.

## Resultado esperado

- El pin seleccionado permanece claro.
- Se elimina ruido visual por labels duplicados sobre el mismo punto.

## Validación mínima

- Lint OK en archivo modificado.
