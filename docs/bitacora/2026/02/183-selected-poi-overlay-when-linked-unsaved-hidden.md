# 183 — Overlay de selección canónica cuando spot ligado está oculto por hideLinkedUnsaved

**Fecha:** 2026-02-26  
**Rama:** `codex/next-search-map-iteration`

## Problema de fondo

El caso "POI seleccionado sin feedback" no era solo visual. Con `hideLinkedUnsaved` activo, un spot ligado (no guardado/no visitado) puede quedar oculto de la capa de spots; por eso el mapa mostraba únicamente el icono POI de Mapbox.

## Solución aplicada

- `components/explorar/MapScreenVNext.tsx`
  - Se detecta cuando `selectedSpot` está activo pero no está presente en `displayedSpots` (`isSelectedSpotHiddenOnMap`).
  - En ese caso se fuerza `previewPin*` para renderizar overlay de selección canónica (`MapPinSpot selected`) en la coordenada del spot.
  - Se preserva estado semántico (`default` / `to_visit` / `visited`) en el overlay.

- `components/explorar/MapCoreView.tsx`
  - `PreviewPinState` ahora soporta `visited`.
  - El preview seleccionado usa `MapPinSpot` con estado semántico completo.

## Impacto

- El usuario siempre ve selección explícita aunque el spot ligado esté oculto por estrategia de limpieza visual.
- Se mantiene la regla de ocultar linked-unsaved sin sacrificar feedback del sistema.

## Validación mínima

- Lint OK en archivos modificados.
