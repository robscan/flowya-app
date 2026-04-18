# 361 — OL-EXPLORE-FILTERS-CHIPS-COUNTERS-001: chips y contador lugares alineados

**Fecha:** 2026-04-18  
**Rama:** `feat/ol-qa-chips-counters-align`

## Objetivo

Cumplir QA: chips activos **etiquetas → país** en barra/sheet y banda del mapa; contador **lugares** del KPI (burbuja + `CountriesSheet`) y título de listado coherentes con filtros OR de etiquetas y alcance país; resumen de resultados en búsqueda cuando hay lista sin exigir query ≥ 3 caracteres.

## Contrato numérico (lugares KPI)

- **Pool:** spots del modo overlay Por visitar / Visitados (`countriesSheetOverlaySpotsPool`).
- **Alcance país:** si `placesScopeForData.kind === "country"`, se restringe el pool a ese país (`resolveCountryForSpot`).
- **Etiquetas:** `filterExploreSearchItemsByTag` con `selectedTagFilterIds` (OR) y `pinTagIndex`.
- **Número mostrado:** cardinal del conjunto resultante (`exploreMapKpiPlacesCount`). Sin etiquetas y sin alcance país por lista coincide con la suma histórica de buckets (`countriesPlacesCountForOverlay`).

## Cambios de código

- [`components/explorar/explore-places-active-filters-bar.tsx`](../../../../components/explorar/explore-places-active-filters-bar.tsx): orden de render en `ExplorePlacesActiveFilterChips`.
- [`components/explorar/MapScreenVNext.tsx`](../../../../components/explorar/MapScreenVNext.tsx): `exploreMapKpiPlacesCount`, burbuja KPI, `CountriesSheet` `summaryPlacesCount`, share card `spotsCount`, `resultsSummaryLabel` en búsqueda.
- [`components/explorar/CountriesSheet.tsx`](../../../../components/explorar/CountriesSheet.tsx): título listado `Lugares (N)`.

## Ops

- [`docs/ops/OPEN_LOOPS.md`](../../../ops/OPEN_LOOPS.md): cola reordenada (QA ítems 1–5 primero); ítem 1 actualizado con referencia a esta bitácora.
