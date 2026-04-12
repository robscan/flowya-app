# 345 — Cierre OL-WEB-RESPONSIVE-001: sidebar desktop, mini-mapa países, toast, docs

**Fecha:** 2026-04-12  
**Tipo:** Cierre de loop operativo + implementación web desktop + UX mapa países + ops/docs

## Resumen

Se cierra **`OL-WEB-RESPONSIVE-001`** con documentación en [`docs/ops/OPEN_LOOPS.md`](../../ops/OPEN_LOOPS.md), planes [`PLAN_OL_WEB_RESPONSIVE_COMPONENTS_001_2026-03-28.md`](../../ops/plans/PLAN_OL_WEB_RESPONSIVE_COMPONENTS_001_2026-03-28.md) y [`PLAN_EXECUTION_POST_WR001_2026-04-12.md`](../../ops/plans/PLAN_EXECUTION_POST_WR001_2026-04-12.md). El loop activo pasa a **`OL-CONTENT-002`**; el siguiente en cola prioritaria queda explícito como **`OL-PRIVACY-001`**.

## Explore desktop: mapa a ancho completo + padding Mapbox

- **`MapScreenVNext.tsx`:** En layout split web, el **stage del mapa** llena el root (`mapStageWebDesktopSplit`); el **sidebar** va encima (orden JSX: mapa debajo, panel después). El hueco lateral lo reserva **`map.setPadding({ left })`** según ancho del panel y fase de presencia, en lugar de encoger el contenedor del mapa con flex y disparar `resize` en cada paso de animación.
- **`flushMapResizeForSidebar`:** Depende de cambios de ventana / umbral split, no del ancho del sidebar animado.
- **`ExploreDesktopSidebarAnimatedColumn.tsx`:** Solo modo **overlay** (host ancho 0, panel `absolute` con animación de ancho); eliminado el modo docked y la prop `onStageWidthAnimationSettled`. Host con `position: absolute; left/top/bottom` para altura completa.

## Búsqueda desktop (sidebar)

- **`SearchOverlayWeb.tsx`:** Alineado a la nueva API del panel: `presenceOpen` en lugar de `animationKey` en `ExploreDesktopSidebarAnimatedColumn`.

## Toast / system status (web)

- **`system-status-bar.tsx`:** Ancla del toast con **redondeo en px** y **deduplicación** de `setAnchor` cuando el ancla no cambia en la práctica (evita re-renders por floats casi iguales al mover sheets/layout).

## Mini-mapa países (web)

- **`countries-map-preview.web.tsx`:** Encuadre inicial **`INITIAL_FIT_BOUNDS`** (sur ~-58°) para **recortar Antártida** al inicio; **`maxBounds`** al mundo completo. Pan **vertical** acotado (borde sur entre encuadre inicial y polo), longitud bloqueada; **rueda** con `preventDefault` y `panBy` vertical. **`isApplyingClampRef`** para evitar recursión infinita `moveend` ↔ `jumpTo` (stack overflow).
- **`CountriesSheet.tsx`**, **`countries-sheet-template-demo.tsx`**, **`app/design-system.web.tsx`:** Altura del preview alineada (**176px** donde aplica).

## Ops

- **`OPEN_LOOPS.md`:** `OL-WEB-RESPONSIVE-001` cerrado; activo **`OL-CONTENT-002`** (marcado explícitamente **abierto** para ejecución); **siguiente en lista** **`OL-PRIVACY-001`** (abierto para priorización, sin paralelismo de ejecución); cola y secciones históricas actualizadas; referencia a esta bitácora `345`.
- Plan responsive: sección **Estado: cerrado (2026-04-12)**.
- Plan ejecución post-WR001: Fase A marcada hecha; criterios de cierre §2 alineados al cierre real.

## Trazabilidad

| Área | Archivos principales |
|------|----------------------|
| Mapa + sidebar | `MapScreenVNext.tsx`, `ExploreDesktopSidebarAnimatedColumn.tsx` |
| Búsqueda overlay | `SearchOverlayWeb.tsx` |
| Toast | `system-status-bar.tsx` |
| Países / DS | `countries-map-preview.web.tsx`, `CountriesSheet.tsx`, demos |
| Docs | `OPEN_LOOPS.md`, `PLAN_OL_WEB_RESPONSIVE_*`, `PLAN_EXECUTION_POST_WR001_*` |

## Trazabilidad GitHub

- Merge implementación (sidebar `setPadding`, mini-mapa países, cierre OL-WEB-RESPONSIVE-001): [**PR #137**](https://github.com/robscan/flowya-app/pull/137) (2026-04-12).
- Índice PR recientes: [`349`](349-indice-trazabilidad-pr-130-139-2026-04.md).

## Referencias

- Canon sidebar: [`EXPLORE_WEB_DESKTOP_SIDEBAR_CANON.md`](../../contracts/EXPLORE_WEB_DESKTOP_SIDEBAR_CANON.md) (si aplica versión vigente en repo).
