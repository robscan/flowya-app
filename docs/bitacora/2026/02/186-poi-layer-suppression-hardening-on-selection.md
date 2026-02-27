# 186 — Hardening supresión de layers POI Mapbox durante selección

**Fecha:** 2026-02-26  
**Rama:** `codex/next-search-map-iteration`

## Problema

En estado seleccionado `default`, aún aparecía label POI de Mapbox en algunos zoom/layers, causando traslape con label canónico Flowya.

## Causa

La supresión anterior ocultaba solo `poi-label` exacto; algunos estilos usan variantes/prefijos de layer o `source-layer` POI distinto.

## Cambio aplicado

- `lib/map-core/constants.ts` (`hideNoiseLayers`)
  - Se amplía detección de capas POI a:
    - ID exacto (`poi-label`),
    - prefijos (`poi-`, `poi_label`, `poi.`),
    - `source-layer` que contenga `poi`.
  - Durante selección (cuando `preservePoiLabels=false`) se ocultan todas las capas POI-like detectadas.

## Resultado esperado

- Comportamiento visual consistente entre `default` y `to_visit` en selección POI.
- Sin label POI Mapbox superpuesto al label canónico de Flowya.

## Validación mínima

- Lint OK en archivos modificados.
