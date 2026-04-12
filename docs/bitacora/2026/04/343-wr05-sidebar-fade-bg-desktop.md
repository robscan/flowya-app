# 343 — WR-05: transiciones sidebar desktop (fondo + fade contenido)

**Fecha:** 2026-04-12  
**Rama:** `feat/wr05-sidebar-transitions-impl`

## Cambios

- **`ExploreDesktopSidebarPanelBody`** (`ExploreDesktopSidebarAnimatedColumn.tsx`): fade-in (~220 ms) al cambiar `panelKey` (`spot` | `countries` | `welcome`), sin animar el primer paint.
- **`MapScreenVNext`:** `backgroundColor: backgroundElevated` en la columna lateral; cuerpo del sheet envuelto en `ExploreDesktopSidebarPanelBody` con `exploreSidebarPanelKey` derivado del modo activo.
- **Contrato:** `EXPLORE_WEB_DESKTOP_SIDEBAR_CANON.md` §4.2 actualizado.

## Verificación

- `npm run typecheck` OK.
