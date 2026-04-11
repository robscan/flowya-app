/**
 * Reglas compartidas de layout web — OL-WEB-RESPONSIVE-001 (WR-01).
 * Ver: docs/ops/plans/PLAN_OL_WEB_RESPONSIVE_COMPONENTS_001_2026-03-28.md
 */

/** Referencias de viewport (documentación / condiciones). */
export const WEB_VIEWPORT_REF = {
  mobileNarrow: 360,
  mobileWide: 430,
  tabletMin: 768,
  tabletMax: 1024,
  desktopMin: 1280,
} as const;

/** Padding horizontal canónico de paneles web (overlay búsqueda, etc.). */
export const WEB_PANEL_PADDING_H = 16;

/**
 * Ancho máximo del panel de búsqueda fullscreen en web (tablet ancha / desktop).
 * El mapa sigue siendo la superficie dominante fuera del overlay.
 */
export const WEB_SEARCH_OVERLAY_MAX_WIDTH = 720;

/** Misma referencia para sheets inferiores (SpotSheet, CountriesSheet) en desktop web. */
export const WEB_SHEET_MAX_WIDTH = WEB_SEARCH_OVERLAY_MAX_WIDTH;

/** Modal secundario embebido (ej. niveles viajero en CountriesSheet) y panel del auth modal web. Más estrecho que el sheet. */
export const WEB_MODAL_CARD_MAX_WIDTH = 460;

/** A partir de este ancho de ventana se centra el panel con ancho máximo. */
export function webSearchUsesConstrainedPanelWidth(windowWidth: number): boolean {
  return windowWidth >= WEB_VIEWPORT_REF.tabletMin;
}

/**
 * Explore web: columna lateral (welcome / países) en lugar de sheet inferior centrado.
 * Umbral de producto (no coincide con desktopMin): ver EXPLORE_CHROME_SHELL.md.
 */
export const WEB_EXPLORE_SIDEBAR_MIN_WIDTH = 1080;

/**
 * Ancho del panel lateral Explore (≥ `WEB_EXPLORE_SIDEBAR_MIN_WIDTH`).
 * Más estrecho que `WEB_SHEET_MAX_WIDTH` para dar más superficie al mapa en desktop.
 */
export const WEB_EXPLORE_SIDEBAR_PANEL_WIDTH = 400;

export function webExploreUsesDesktopSidebar(windowWidth: number): boolean {
  return windowWidth >= WEB_EXPLORE_SIDEBAR_MIN_WIDTH;
}
