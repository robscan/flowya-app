# 344 — MapControls por encima de FILTER (z-index)

**Fecha:** 2026-04-12  
**Rama:** `feat/wr05-sidebar-transitions-impl`

## Problema

En desktop, los controles del mapa dejaban de recibir toques: el contenedor del **filtro** (`filterOverlay`, `zIndex` 14) puede tener una caja de hit-test que se solapa con la zona inferior del mapa en algunos layouts web; `MAP_CONTROLS` estaba en **10** (< 14).

## Cambio

- `layer-z.ts`: **`MAP_CONTROLS: 15`**, entre `FILTER` (14) y `TOP_ACTIONS` (16).
- `ExploreDesktopSidebarPanelBody`: `pointerEvents="box-none"` en el `Animated.View` (defensivo).
- `EXPLORE_WEB_DESKTOP_SIDEBAR_CANON.md` §6.1 actualizado.
