# 335 — Explore web: panel lateral ≥1080px (map stage + toast)

**Fecha:** 2026-04-11

## Contexto

Plan Explore desktop: evitar sheet inferior centrado que tapa el mapa en viewports anchos; mapa centrado en el área útil a la derecha del panel.

## Cambios

- `lib/web-layout.ts`: `WEB_EXPLORE_SIDEBAR_MIN_WIDTH` (1080), `WEB_EXPLORE_SIDEBAR_PANEL_WIDTH`, `webExploreUsesDesktopSidebar`.
- `lib/explore-map-chrome-layout.ts`: `exploreDesktopSidebarActive`, `mapStageWidth`, `flowyaRowFullMapStageWidth`; offsets de filtros/FLOWYA sin altura de sheet inferior cuando el panel es lateral.
- `ExploreWelcomeSheet`: `webExploreLayout="desktopSidebar"`.
- `CountriesSheet`: `webDesktopSidebar`.
- `MapScreenVNext`: fila `sidebar | mapStage`; toast con `left` compensado; `resize` del mapa al cambiar layout.
- Contrato: `EXPLORE_CHROME_SHELL.md` §8b.

## QA sugerido

- Ventana &lt;1080: sin regresión sheet inferior.
- ≥1080: Todos + welcome en columna; KPI + países abiertos en columna; FLOWYA y pastilla a ancho del map stage.
