# 208 — Cierre OL-WOW-F2-001-EMPTY Lista unificada isEmpty

Fecha: 2026-02-28  
Tipo: cierre operativo / OL-WOW-F2-001-EMPTY

## Contexto
OL-WOW-F2-001-EMPTY: fusionar Flowya spots cercanos + POIs por categoría Mapbox (Category API) en lista única cuando isEmpty (query vacía, Search abierto).

## Implementación
- **lib/places/searchPlacesCategory.ts** (nuevo): `searchPlacesByCategory(category, opts)` usando Mapbox Search Box Category API. Categoría `attraction`.
- **MapScreenVNext:** estado `nearbyPlacesEmpty`, useEffect fetch cuando isEmpty y pinFilter=all. Dedupe con `dedupeExternalPlacesAgainstSpots`.
- **defaultItemsForEmpty:** merge `defaultSpots` + `nearbyPlacesEmpty` con `mergeSearchResults` cuando pinFilter=all. Pasado a SearchFloating como defaultItems.
- **SearchSurface:** `hideDefaultListTitle = hideListTitles || pinFilter === 'all'` — sin etiqueta "Spots cercanos" cuando hay merge.

## Criterios de aceptación
- [x] Query vacía, Search abierto, pinFilter=all → lista única con spots Flowya + POIs attraction.
- [x] Sin etiquetas "Spots cercanos" vs "Lugares cercanos".
- [x] Tap en spot DB → ficha; tap en POI → Crear spot.
- [x] pinFilter saved/visited → solo spots Flowya.

## Validación
- Smoke en localhost: abrir Search con query vacía y pinFilter=all → lista unificada; saved/visited → solo spots.

## Resultado
- OL-WOW-F2-001-EMPTY cerrado. Lista unificada isEmpty operativa.
