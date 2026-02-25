# Bitácora 128 — Mitigación runtime para 404 de tileset landmark

**Fecha:** 2026-02-25  
**Rama:** `codex/search-poi-linking-phase-b`

---

## Objetivo

Reducir ruido de consola por requests 404 al tileset `mapbox.mapbox-landmark-pois-v1` cuando landmarks están desactivados en la app.

## Cambios aplicados

Archivos:

- `lib/map-core/constants.ts`
- `hooks/useMapCore.ts`

Ajustes:

- Se reemplaza helper `showLandmarkLabels` por `setLandmarkLabelsEnabled(map, enabled)`.
- En `onMapLoad` de `useMapCore`, se aplica siempre el estado explícito:
  - `enableLandmarkLabels=true` -> activa landmarks.
  - `enableLandmarkLabels=false` -> desactiva landmarks.

## Nota técnica

Este ajuste mitiga requests innecesarios cuando la configuración `basemap` responde al toggle. Si el estilo publicado en Mapbox Studio mantiene referencias directas a esa fuente, el 404 debe corregirse en el style (quitar/ajustar source/layers y republcar).
