/**
 * Canonical z-index contract for Explore overlays.
 * Keep all depth values centralized to avoid regressions by local tweaks.
 */
export const EXPLORE_LAYER_Z = {
  FLOWYA_LABEL: 5,
  SHEET_BASE: 8,
  MAP_CONTROLS: 10,
  TOP_ACTIONS: 12,
  FILTER: 14,
} as const;

