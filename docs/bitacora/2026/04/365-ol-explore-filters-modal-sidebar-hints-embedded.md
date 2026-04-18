# 365 — OL-EXPLORE-FILTERS-MODAL-SIDEBAR-001: hints, copy alineado, panel embebido desktop

**Fecha:** 2026-04-18  
**Rama:** `feat/ol-explore-filters-modal-sidebar-001`

## Objetivo

Cerrar **`OL-EXPLORE-FILTERS-MODAL-SIDEBAR-001`**: hints de **etiquetas** y **país**, microcopy alineado con la entrada sheet, y **variante sidebar** (sin `Modal` fullscreen cuando el panel países desktop está visible y Search no tapa).

## Cambios

- [`components/explorar/explore-places-filters-modal.tsx`](../../../components/explorar/explore-places-filters-modal.tsx):
  - Título unificado **`Etiquetas y filtros`** (paridad con `ExplorePlacesActiveFiltersBar`).
  - **Etiquetas:** hint OR existente + línea «Mantén pulsada una etiqueta para borrarla» si hay borrado/edición.
  - **País:** hint «Elige un país o «Todos». Se combina con las etiquetas que marques arriba.»
  - Prop `presentation`: **`modal`** (comportamiento previo con `Modal` + `SafeAreaView`) o **`sidebarPanel`** (vista embebida `flex:1`, sin `Modal`).
  - Contenido extraído en `ExplorePlacesFiltersPanelContent` (mismo scroll y secciones).

- [`components/explorar/MapScreenVNext.tsx`](../../../components/explorar/MapScreenVNext.tsx):
  - `embedExplorePlacesFiltersInDesktopSidebar`: web + split layout + panel países en sidebar + Search cerrado.
  - `explorePlacesFiltersModalProps` memoizado para no duplicar props.
  - `CountriesSheet` en sidebar envuelto en `exploreSidebarCountriesHost`; overlay **`exploreSidebarFiltersOverlay`** con `ExplorePlacesFiltersModal` `presentation="sidebarPanel"` cuando aplica embed.
  - Modal fullscreen solo si `explorePlacesFiltersOpen && !embed…`.

## Resultado

En **web ≥1080** con **Countries** en la columna izquierda, abrir filtros desde la barra Lugares muestra el **mismo panel** encima del sheet de países (cerrar con X). Con **Search** abierto o sin sidebar países, sigue el **Modal** a pantalla completa. Móvil / sheet inferior: sin cambio de interacción (Modal).

## Referencia operativa

- [`docs/ops/OPEN_LOOPS.md`](../../ops/OPEN_LOOPS.md) — cola §4 cerrada; siguiente §5.
