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

/** A partir de este ancho de ventana se centra el panel con ancho máximo. */
export function webSearchUsesConstrainedPanelWidth(windowWidth: number): boolean {
  return windowWidth >= WEB_VIEWPORT_REF.tabletMin;
}
