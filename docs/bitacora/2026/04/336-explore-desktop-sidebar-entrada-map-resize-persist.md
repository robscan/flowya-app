# 336 — Explore desktop sidebar: entrada sin repetir, resize mapa, persistencia welcome

**Fecha:** 2026-04-11

## Tipo

Cierre técnico / OL-WEB-RESPONSIVE-001 (seguimiento 335).

## Resumen

- **`ExploreDesktopSidebarAnimatedColumn`:** animación de entrada por ancho; `skipEntranceAnimation` si el panel lateral ya estaba visible (cambio de filtro/sheet sin re-animar); `onStageWidthAnimationFrame` para `map.resize()` durante la animación (globo/canvas alineados).
- **`MapScreenVNext`:** `scheduleMapResizeForSidebar` + doble `requestAnimationFrame` en efecto de layout; ref `desktopSidebarHadPanel` + `skipDesktopSidebarEntrance`; persistencia inmediata web en dismiss/reopen de welcome (`setWelcomeSidebarDismissedPreference`).
- **Chrome / layout / overlays:** `lib/explore-map-chrome-layout`, `ExploreChromeShell`, welcome/search/SpotSheet/SearchOverlay según contrato sidebar desktop.

## QA sugerido

Web ≥1080: abrir/cerrar sidebar y cambiar filtros KPI; globo sin desfase; welcome cerrado permanece tras recarga (KV).
