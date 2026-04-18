# 364 — OL-EXPLORE-FILTERS-ENTRY-LAYOUT-001: entrada primaria + fila buscador en sheet

**Fecha:** 2026-04-18  
**Rama:** `feat/ol-explore-filters-entry-layout-001`

## Objetivo

Cerrar **`OL-EXPLORE-FILTERS-ENTRY-LAYOUT-001`**: botón **primario**, copy canónico **«Etiquetas y filtros»**, y **una sola fila** con el launcher de búsqueda del sheet (placeholder **truncado** con `numberOfLines={1}` en `SearchLauncherField`), sin duplicar el buscador encima del bloque de chips.

## Cambios

- [`components/explorar/explore-places-active-filters-bar.tsx`](../../../components/explorar/explore-places-active-filters-bar.tsx): prop opcional `filtersSearchInline`; entrada primaria (`tagChipBackground` + `surfaceOnMap`); label unificado **Etiquetas y filtros**; fila `entrySearchRow` + `SearchLauncherField` `variant="sheet"`.
- [`components/explorar/CountriesSheet.tsx`](../../../components/explorar/CountriesSheet.tsx): prop `placesListFilterBarEmbedsSheetSearch`; si el host compone buscador en la barra, se omite el `SearchLauncherField` suelto del header; `DETAIL_TAG_ROW_HEIGHT` ajustado a **108** para baseline de lista.
- [`components/explorar/MapScreenVNext.tsx`](../../../components/explorar/MapScreenVNext.tsx): pasa `filtersSearchInline` (mismo `openSearchPreservingCountriesSheet` y placeholder que el sheet) y `placesListFilterBarEmbedsSheetSearch` en sheet móvil y sidebar desktop.

## Resultado

En **Por visitar / Visitados** con barra de filtros Lugares, el usuario ve chips (si hay) y debajo **una fila**: CTA primario **Etiquetas y filtros** + pastilla de búsqueda que comparte el comportamiento previo del header. En el overlay **Search** la barra sigue debajo del input propio del overlay, con el mismo CTA primario (sin fila duplicada de buscador).

## Referencia operativa

- [`docs/ops/OPEN_LOOPS.md`](../../ops/OPEN_LOOPS.md) — cola §3 marcada cerrada con enlace a esta bitácora.
