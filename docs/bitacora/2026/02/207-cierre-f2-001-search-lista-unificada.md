# 207 — Cierre OL-WOW-F2-001-SEARCH Lista unificada isSearch

Fecha: 2026-02-28  
Tipo: cierre operativo / OL-WOW-F2-001-SEARCH

## Contexto
OL-WOW-F2-001-SEARCH: fusionar Flowya spots + POIs/landmarks Mapbox en la lista principal de resultados isSearch cuando pinFilter=all, con un único listado ordenado por atractivo/interés y misma fila visual para Spot y PlaceResult.

## Implementación
- **mergeSearchResults(spots, places, query)** (MapScreenVNext): dedupe places vs spots, ranking unificado. Prioridad: poi_landmark > place > poi (places); spots con pinStatus primero.
- **Fetch placeSuggestions**: siempre cuando query >= 3 y pinFilter=all (antes: results.length === 0 || searchMixedRanking).
- **searchDisplayResults**: cuando pinFilter=all → merge(searchV2.results, placeSuggestions, query). Cuando saved/visited → solo spots con reorden viewport.
- **renderItem** union Spot | PlaceResult: Spot → SearchResultCard; PlaceResult → ResultRow con handleCreateFromPlace.
- **getItemKey** union: Spot → id; PlaceResult → id ?? `place-${lat}-${lng}`.
- **Footer**: placeSuggestions={pinFilter === "all" ? [] : placeSuggestions} — no duplicar places cuando hay merge.

## Criterios de aceptación
- [x] Query >= 3, pinFilter=all → lista con spots DB + POIs/landmarks en orden unificado.
- [x] Tap en spot DB → ficha (sheet medium).
- [x] Tap en POI → flujo Crear spot (handleCreateFromPlace).
- [x] pinFilter saved/visited → solo spots Flowya.

## Validación
- Smoke en localhost: búsqueda con pinFilter=all muestra merge; saved/visited solo spots.

## Resultado
- OL-WOW-F2-001-SEARCH cerrado. Lista unificada operativa.
