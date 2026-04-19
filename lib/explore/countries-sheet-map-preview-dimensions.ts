/**
 * Dimensiones del mini-mapa en `CountriesSheet` (KPI países).
 * Fuente de verdad compartida con la captura offscreen de `visited-countries-share`
 * para que el PNG compuesto coincida con el snapshot del sheet.
 */
import {
  WEB_EXPLORE_SIDEBAR_MIN_WIDTH,
  WEB_EXPLORE_SIDEBAR_PANEL_WIDTH,
  WEB_SHEET_MAX_WIDTH,
} from "@/lib/web-layout";

/** Igual que `paddingHorizontal: 14` ×2 en el `container` de `CountriesSheet`. */
export const COUNTRIES_SHEET_CONTAINER_PADDING_H = 28;

/** Igual que `MAP_PREVIEW_HEIGHT` en `CountriesSheet.tsx`. */
export const COUNTRIES_SHEET_MAP_PREVIEW_HEIGHT_PX = 176;

/** Ancho interior del mapa en sidebar desktop KPI (400 − padding). */
export const COUNTRIES_SHEET_MAP_PREVIEW_INNER_WIDTH_DESKTOP_PX =
  WEB_EXPLORE_SIDEBAR_PANEL_WIDTH - COUNTRIES_SHEET_CONTAINER_PADDING_H;

/**
 * Tamaño en px del viewport del `CountriesMapPreview` como en el sheet:
 * - Desktop Explore (≥1080): panel 400 − padding.
 * - Más angosto: ancho máximo de sheet centrado (`WEB_SHEET_MAX_WIDTH`) acotado al viewport, menos padding.
 */
export function getCountriesSheetMapPreviewCaptureSizePx(windowWidth: number): {
  width: number;
  height: number;
} {
  const height = COUNTRIES_SHEET_MAP_PREVIEW_HEIGHT_PX;
  if (windowWidth >= WEB_EXPLORE_SIDEBAR_MIN_WIDTH) {
    return { width: COUNTRIES_SHEET_MAP_PREVIEW_INNER_WIDTH_DESKTOP_PX, height };
  }
  const panelOuter = Math.min(WEB_SHEET_MAX_WIDTH, Math.max(280, windowWidth));
  const inner = Math.max(200, panelOuter - COUNTRIES_SHEET_CONTAINER_PADDING_H);
  return { width: inner, height };
}
