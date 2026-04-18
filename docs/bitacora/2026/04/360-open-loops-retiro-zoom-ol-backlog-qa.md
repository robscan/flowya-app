# 360 — OPEN_LOOPS: retiro OL zoom web y backlog QA Explore + toast

**Fecha:** 2026-04-18  
**Rama:** `ops/open-loops-retire-zoom-ol-qa-backlog`

## Objetivo

Documentar en operaciones el retiro definitivo de `OL-EXPLORE-WEB-ZOOM-GUARD-001` y agrupar en OL dedicados el feedback de QA (filtros, chips, contadores, Countries sheet, toast).

## Cambios

- [`docs/ops/OPEN_LOOPS.md`](../../../ops/OPEN_LOOPS.md): eliminado el ítem de cola del zoom guard; estado **retirado** en Cierres; nueva sección **Backlog QA Explore + toast (2026-04-18)** con cinco OL (`OL-EXPLORE-FILTERS-CHIPS-COUNTERS-001`, `OL-SYSTEM-TOAST-SEMANTIC-STABLE-001`, `OL-EXPLORE-FILTERS-ENTRY-LAYOUT-001`, `OL-EXPLORE-FILTERS-MODAL-SIDEBAR-001`, `OL-EXPLORE-COUNTRIES-SHEET-LAYOUT-001`); filas en inventario 2026-04-12.

## Resultado

Fuente operativa alineada con decisión de producto: zoom web nativo sin loop de reintento. QA priorizable en OL separados sin mezclar la cola «En espera» hasta decisión explícita.
