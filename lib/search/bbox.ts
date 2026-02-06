/**
 * BBox estable para cache y query: redondeo por zoom para evitar ruido y cache misses.
 */

export type BBox = {
  west: number;
  south: number;
  east: number;
  north: number;
};

/** Precisión en decimales por nivel de zoom (más zoom = más precisión). */
function precisionForZoom(zoom: number): number {
  if (zoom >= 16) return 4;
  if (zoom >= 12) return 3;
  if (zoom >= 8) return 2;
  return 1;
}

function roundCoord(value: number, decimals: number): number {
  const p = 10 ** decimals;
  return Math.round(value * p) / p;
}

/**
 * Devuelve un bbox redondeado para la misma vista (estable para cache key).
 */
export function stableBBox(bbox: BBox, zoom: number): BBox {
  const p = precisionForZoom(zoom);
  return {
    west: roundCoord(bbox.west, p),
    south: roundCoord(bbox.south, p),
    east: roundCoord(bbox.east, p),
    north: roundCoord(bbox.north, p),
  };
}

/**
 * Expande bbox por un factor (ej. 3 para stage "expanded").
 */
export function expandBBox(bbox: BBox, factor: number): BBox {
  const w = bbox.east - bbox.west;
  const h = bbox.north - bbox.south;
  const cLng = (bbox.west + bbox.east) / 2;
  const cLat = (bbox.south + bbox.north) / 2;
  const halfW = (w * factor) / 2;
  const halfH = (h * factor) / 2;
  return {
    west: cLng - halfW,
    south: cLat - halfH,
    east: cLng + halfW,
    north: cLat + halfH,
  };
}
