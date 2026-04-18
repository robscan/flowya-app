# 369 — Explore (web/desktop): hover listado→pin, pines DOT, KPI países/lugares, fitBounds, búsqueda scroll, copy

**Fecha:** 2026-04-18  
**Rama de trabajo:** `feat/ol-explore-countries-sheet-layout-001`

## Resumen

Cierre documental de la sesión que endurece **paridad mapa↔listado en desktop**, **estética canónica de pines** Por visitar/Visitado en reposo, **regresiones de KPI y encuadre por país**, **scroll unificado del overlay de búsqueda** y **microcopy** (CTA «Filtrar» y toast de filtro pendientes).  
Encuadre anti-océano detallado en bitácora [`368`](368-explore-fitbounds-pais-anti-oceano.md).

## Comportamiento / producto

| Tema | Qué se hizo |
|------|----------------|
| **Hover listado → pin seleccionado (web)** | En `Platform.OS === "web"`, el id del spot bajo hover en listas se propaga a la capa de spots; GeoJSON marca `selected` si coincide con selección explícita **o** hover de listado. Cubre overlay de búsqueda, detalle país y welcome sheet vía `onHoverChange` / `onHoverChangeSpotId`. |
| **Pines Por visitar / Visitado en reposo** | Sprites `FLOWYA_PIN_*_DOT` (sin icono interior), tokens `mapPinSpot` en `constants/theme.ts`; en estado seleccionado/hover se usan variantes con icono. |
| **Sheet países en desktop** | El panel ancho solo cuando hay **listado de lugares** (`countriesSheetListView != null`), no solo por filtro de país en el mapa. |
| **KPI mapa (Países vs Lugares)** | Toque en contador **Países** abre la vista lista de países; **Lugares** abre siempre la ruta de lugares. Evita quedar atrapado en la vista incorrecta al alternar. |
| **Encuadre al elegir país** | `fitBounds` aplazado si el mapa aún no está listo (`pendingCountryFitBoundsRef` + efecto al tener `mapInstance`); en web doble `requestAnimationFrame` para timing de layout. Heurística bbox: [`368`](368-explore-fitbounds-pais-anti-oceano.md). |
| **Búsqueda: scroll** | Fila fija superior: pin filter + cerrar. Resto (input, barra filtros, chips, hints, resultados) dentro de un único área scroll vía `SearchSurface` + `header` en `SearchResultsListV2`. |
| **CTA filtros** | Etiqueta canónica **«Filtrar»** (`explore-places-active-filters-bar.tsx`, constante `FILTERS_ENTRY_LABEL`). |
| **Toast filtro «Solo pendientes»** | Copy: *«Solo pendientes: Planea tu siguiente aventura.»* (evita prometer reordenación de lista). |

## Corrección técnica

- **`CountriesSheet`:** `return null` por `visible` movido **después** de todos los hooks para cumplir orden de hooks de React (evita «Rendered more hooks than during the previous render»).

## Archivos tocados (trazabilidad)

- `components/explorar/MapScreenVNext.tsx`
- `components/explorar/CountriesSheet.tsx`
- `components/explorar/explore-places-active-filters-bar.tsx`
- `components/search/SearchSurface.tsx`
- `components/search/SearchResultsListV2.tsx`
- `components/design-system/search-list-card.tsx`
- `components/design-system/search-result-card.tsx`
- `components/design-system/explore-welcome-sheet.tsx`
- `components/design-system/map-pins.tsx`
- `hooks/useMapCore.ts`
- `lib/map-core/spots-layer.ts`
- `lib/map-core/pin-status-images.ts`
- `lib/map-core/style-image-fallback.ts`
- `constants/theme.ts`

## Seguimiento (fuera de este cierre)

- **`OL-EXPLORE-SHEETS-CANON-001`:** canon compartido de sheets + documentación splash Welcome (sigue 1.º en cola operativa según `OPEN_LOOPS.md`).
- **Lista operativa Explore (producto):** verificar en QA **estilo primario** del botón «Filtrar» y **una sola línea** buscador+CTA donde aplique; propuesta UX **Countries** (mapa primero vs lista) si producto la prioriza.

## Referencias

- [`docs/ops/OPEN_LOOPS.md`](../../ops/OPEN_LOOPS.md)
- [`368-explore-fitbounds-pais-anti-oceano.md`](368-explore-fitbounds-pais-anti-oceano.md)
