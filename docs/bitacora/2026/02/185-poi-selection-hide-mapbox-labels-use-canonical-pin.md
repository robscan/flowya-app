# 185 — Selección POI: ocultar labels POI de Mapbox y usar pin+label canónico

**Fecha:** 2026-02-26  
**Rama:** `codex/next-search-map-iteration`

## Problema

En zoom/encuadre cercano se observaba desfase visual: coexistían label/ícono de POI Mapbox y el pin seleccionado propio, generando doble fuente de verdad.

## Decisión de fondo

Durante selección activa de POI (o selected spot oculto por `hideLinkedUnsaved`):
- ocultar labels/iconos POI de Mapbox,
- renderizar solo pin seleccionado canónico de Flowya con su label.

## Cambios aplicados

- `components/explorar/MapScreenVNext.tsx`
  - Se agrega `shouldSuppressMapboxPoiLabels`.
  - `useMapCore` recibe `enableLandmarkLabels = featureFlags.mapLandmarkLabels && !shouldSuppressMapboxPoiLabels`.
  - Se restaura `previewPinLabel` para selección POI y selected spot oculto.

## Resultado esperado

- El usuario ve una sola representación de selección (pin+label Flowya) sin solapamientos con POI de Mapbox.
- Al salir de selección, se restaura comportamiento normal de labels de mapa.

## Validación mínima

- Lint OK en archivos modificados.
