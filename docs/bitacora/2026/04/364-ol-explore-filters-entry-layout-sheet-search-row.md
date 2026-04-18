# 364 — OL-EXPLORE-FILTERS-ENTRY-LAYOUT-001: entrada primaria + fila buscador en sheet

**Fecha:** 2026-04-18  
**Rama:** `feat/ol-explore-filters-entry-layout-001`

## Objetivo

Cerrar **`OL-EXPLORE-FILTERS-ENTRY-LAYOUT-001`**: en la ventana Lugares, orden vertical **buscador → CTA primario** (misma fila: buscador a la izquierda, CTA a la derecha) → **chips activos debajo**; placeholder del launcher **truncado** (`numberOfLines={1}` en `SearchLauncherField`); sin duplicar el buscador en el header del sheet cuando aplica embed.

## Cambios

- [`components/explorar/explore-places-active-filters-bar.tsx`](../../../components/explorar/explore-places-active-filters-bar.tsx): prop opcional `filtersSearchInline`; fila entrada **buscador luego CTA**; chips debajo; CTA primario (`tagChipBackground` + `surfaceOnMap`); label provisional **Etiquetas y filtros** (ver § deuda copy).
- [`components/explorar/CountriesSheet.tsx`](../../../components/explorar/CountriesSheet.tsx): prop `placesListFilterBarEmbedsSheetSearch`; si el host compone buscador en la barra, se omite el `SearchLauncherField` suelto del header; `DETAIL_TAG_ROW_HEIGHT` ajustado a **108** para baseline de lista.
- [`components/explorar/MapScreenVNext.tsx`](../../../components/explorar/MapScreenVNext.tsx): pasa `filtersSearchInline` en sheet; `placesSearchFilterBarEl` como **función** que monta `filtersEntryLeading={searchField}` para el overlay Search.
- [`components/search/types.ts`](../../../components/search/types.ts), [`SearchSurface.tsx`](../../../components/search/SearchSurface.tsx): `placesFiltersBar` admite render `( { searchField } ) => …` para componer fila buscador + barra.

## Resultado

En **Por visitar / Visitados** con barra de filtros Lugares: **fila** buscador + CTA, luego chips si hay. En el overlay **Search** (`SearchSurface` + `placesFiltersBar` como función), **misma fila**: pastilla `SearchInputV2` + CTA, chips debajo — paridad con el sheet (sin buscador ancho completo duplicado encima del CTA).

## Microcopy CTA vs modal (resuelto en `365`)

La alineación del título del modal con el CTA sheet quedó en **`OL-EXPLORE-FILTERS-MODAL-SIDEBAR-001`** — bitácora [`365`](365-ol-explore-filters-modal-sidebar-hints-embedded.md) (`Etiquetas y filtros` en ambos).

## Referencia operativa

- [`docs/ops/OPEN_LOOPS.md`](../../ops/OPEN_LOOPS.md) — cola §3 marcada cerrada con enlace a esta bitácora.
