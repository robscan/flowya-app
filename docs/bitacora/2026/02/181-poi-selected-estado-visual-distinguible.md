# 181 — POI seleccionado con estado visual distinguible (default vs selected)

**Fecha:** 2026-02-26  
**Rama:** `codex/next-search-map-iteration`

## Objetivo

Corregir ausencia de feedback visual en selección de POI Mapbox cuando el estado era `default` (se veía igual al no seleccionado).

## Cambio aplicado

- `components/explorar/MapCoreView.tsx`
  - Se reemplaza el render de POI seleccionado por una estructura de doble capa (`outer + inner`) para jerarquía visual clara.
  - El estado `default` ahora mantiene color semántico oscuro pero con anillo/borde y tamaño mayor para indicar selección.
  - El estado `to_visit` conserva color semántico y también refleja selección con la misma jerarquía visual.
  - Landmarks seleccionados también reciben marca visual reforzada (outer + inner), evitando ambigüedad.

## Impacto UX

- El usuario recibe confirmación inmediata de estado seleccionado en POI externo.
- Se reduce confusión entre “POI seleccionado” y “POI no seleccionado” en flujos map/filter/controls/search.

## Validación mínima

- Lint OK en archivo modificado.
