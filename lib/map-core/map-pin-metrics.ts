/**
 * Métricas únicas para pins de mapa: círculos Mapbox (default) vs sprites compuestos
 * (por visitar / visitado). Debe coincidir con `spots-layer` + `pin-status-images` + `MapPinSpot`.
 */

import { Colors } from '@/constants/theme';

export type MapPinSpotPalette = (typeof Colors)['light']['mapPinSpot'];

/** Canvas físico del PNG/SVG antes de `addImage(..., { pixelRatio })`. */
export const MAP_PIN_COMPOSITE_IMAGE_PX = 32;

/** Mismo valor que en `pin-status-images` / `style-image-fallback` al registrar el sprite. */
export const MAP_PIN_COMPOSITE_PIXEL_RATIO = 2;

/** Trazo halo alrededor del disco (coordenadas asset 32×32). */
export const MAP_PIN_COMPOSITE_HALO_STROKE_PX = 1.5;

/**
 * Diámetro del relleno circular (r=12) / canvas 32. Alineado con el SVG compuesto en mapa.
 */
export const MAP_PIN_COMPOSITE_FILL_DIAMETER_RATIO = 24 / MAP_PIN_COMPOSITE_IMAGE_PX;

/**
 * Diámetro total disco (relleno + halo) / canvas 32 — 24 + 2×1.5 trazo centrado ≈ 27 en el eje visual.
 */
export const MAP_PIN_COMPOSITE_DISC_OUTER_RATIO = (24 + 2 * MAP_PIN_COMPOSITE_HALO_STROKE_PX) / MAP_PIN_COMPOSITE_IMAGE_PX;

const BASE_LOGICAL_SPRITE_PX = MAP_PIN_COMPOSITE_IMAGE_PX / MAP_PIN_COMPOSITE_PIXEL_RATIO;

/** Radio del círculo de relleno en coordenadas del asset (SVG `r`). */
export function getCompositeAssetFillRadiusPx(): number {
  return (MAP_PIN_COMPOSITE_IMAGE_PX * MAP_PIN_COMPOSITE_FILL_DIAMETER_RATIO) / 2;
}

/** Spots default en capa `circle`: diámetro = radius×2. */
export function getSpotCircleMetrics(palette: MapPinSpotPalette, selected: boolean) {
  if (selected) {
    return {
      diameter: palette.selected.radius * 2,
      strokeWidth: palette.selected.strokeWidth,
    };
  }
  return {
    diameter: palette.unselected.radius * 2,
    strokeWidth: palette.unselected.strokeWidth,
  };
}

/** Trazos del icono Pin/Check en el SVG (espacio asset), escalados al tamaño de pantalla del sprite. */
export function getCompositeIconStrokeWidths(outerSpriteDisplayPx: number) {
  const k = outerSpriteDisplayPx / MAP_PIN_COMPOSITE_IMAGE_PX;
  return {
    pin: 2 * k,
    check: 2.2 * k,
  };
}

/**
 * Pins por visitar/visitado: sprite lógico 16×16 × `makiIconSize`, mismo criterio que `icon-size` Mapbox.
 */
export function getCompositePinMetrics(palette: MapPinSpotPalette, selected: boolean) {
  const maki = selected ? palette.selected.makiIconSize : palette.unselected.makiIconSize;
  const outerSpriteSize = BASE_LOGICAL_SPRITE_PX * maki;
  const haloStrokeWidth = MAP_PIN_COMPOSITE_HALO_STROKE_PX * (outerSpriteSize / MAP_PIN_COMPOSITE_IMAGE_PX);
  const discOuterDiameter = outerSpriteSize * MAP_PIN_COMPOSITE_DISC_OUTER_RATIO;
  const fillDiameter = discOuterDiameter - 2 * haloStrokeWidth;
  const sw = getCompositeIconStrokeWidths(outerSpriteSize);
  const iconSize = Math.round(
    fillDiameter * (palette.selected.plusTextSize / (palette.selected.radius * 2))
  );
  return {
    outerSpriteSize,
    discOuterDiameter,
    haloStrokeWidth,
    fillDiameter,
    iconSize,
    pinIconStrokeWidth: sw.pin,
    checkIconStrokeWidth: sw.check,
  };
}

/** Factor histórico: punto de ubicación usuario vs radio spot en reposo. */
export const USER_LOCATION_DOT_RADIUS_FACTOR = 1.75;

export function getUserLocationPinSize(palette: MapPinSpotPalette): number {
  return Math.round(palette.unselected.radius * USER_LOCATION_DOT_RADIUS_FACTOR);
}
