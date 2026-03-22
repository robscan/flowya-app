/**
 * Canonical z-index contract for Explore overlays.
 * Keep all depth values centralized to avoid regressions by local tweaks.
 *
 * TOP_ACTIONS debe quedar por encima de FILTER: la franja del filtro ocupa todo el ancho
 * (left/right 0); si FILTER > TOP_ACTIONS, en web el overlay tapa el botón de búsqueda y
 * el bloque de perfil aunque usen pointerEvents box-none en el filtro.
 */
export const EXPLORE_LAYER_Z = {
  FLOWYA_LABEL: 5,
  SHEET_BASE: 8,
  MAP_CONTROLS: 10,
  FILTER: 14,
  /** Por encima de FILTER — botón buscar, perfil, slogan superior. */
  TOP_ACTIONS: 16,
} as const;

