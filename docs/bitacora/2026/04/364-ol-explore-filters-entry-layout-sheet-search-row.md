# 364 — OL-EXPLORE-FILTERS-ENTRY-LAYOUT-001: entrada primaria + fila buscador en sheet

**Fecha:** 2026-04-18  
**Rama:** `feat/ol-explore-filters-entry-layout-001`

## Objetivo

Cerrar **`OL-EXPLORE-FILTERS-ENTRY-LAYOUT-001`**: en la ventana Lugares, orden vertical **buscador → CTA primario** (misma fila: buscador a la izquierda, CTA a la derecha) → **chips activos debajo**; placeholder del launcher **truncado** (`numberOfLines={1}` en `SearchLauncherField`); sin duplicar el buscador en el header del sheet cuando aplica embed.

## Cambios

- [`components/explorar/explore-places-active-filters-bar.tsx`](../../../components/explorar/explore-places-active-filters-bar.tsx): prop opcional `filtersSearchInline`; fila entrada **buscador luego CTA**; chips debajo; CTA primario (`tagChipBackground` + `surfaceOnMap`); label provisional **Etiquetas y filtros** (ver § deuda copy).
- [`components/explorar/CountriesSheet.tsx`](../../../components/explorar/CountriesSheet.tsx): prop `placesListFilterBarEmbedsSheetSearch`; si el host compone buscador en la barra, se omite el `SearchLauncherField` suelto del header; `DETAIL_TAG_ROW_HEIGHT` ajustado a **108** para baseline de lista.
- [`components/explorar/MapScreenVNext.tsx`](../../../components/explorar/MapScreenVNext.tsx): pasa `filtersSearchInline` (mismo `openSearchPreservingCountriesSheet` y placeholder que el sheet) y `placesListFilterBarEmbedsSheetSearch` en sheet móvil y sidebar desktop.

## Resultado

En **Por visitar / Visitados** con barra de filtros Lugares: **fila** buscador + CTA, luego chips si hay. En el overlay **Search**, el input global va arriba; en la barra de filtros solo el **CTA** y debajo los chips (sin segunda pastilla de búsqueda).

## Deuda — microcopy CTA vs modal

No había un ítem posterior en cola solo para el texto del botón: **`OL-EXPLORE-FILTERS-MODAL-SIDEBAR-001`** (cola §4) es el sitio natural para **unificar copy** entre la entrada sheet (**«Etiquetas y filtros»**, provisional) y el título del modal [`ExplorePlacesFiltersModal`](../../../components/explorar/explore-places-filters-modal.tsx) (**«Filtros»** hoy). Queda explícito en `OPEN_LOOPS` §4.

## Referencia operativa

- [`docs/ops/OPEN_LOOPS.md`](../../ops/OPEN_LOOPS.md) — cola §3 marcada cerrada con enlace a esta bitácora.
