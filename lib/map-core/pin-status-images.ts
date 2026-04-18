/**
 * Imágenes compuestas (círculo + icono) para pins Por visitar y Visitados.
 * Por visitar: Lucide Pin (mismo que filtro). Visitados: solo palomita. Resuelve traslape.
 * Geometría y colores desde `map-pin-metrics` + `mapPinSpot` del theme (mismo criterio que `spots-layer`).
 */

import type { Map as MapboxMap } from 'mapbox-gl';

import { Colors } from '@/constants/theme';

import {
  getCompositeAssetFillRadiusPx,
  MAP_PIN_COMPOSITE_HALO_STROKE_PX,
  MAP_PIN_COMPOSITE_IMAGE_PX,
  MAP_PIN_COMPOSITE_PIXEL_RATIO,
  type MapPinSpotPalette,
} from '@/lib/map-core/map-pin-metrics';

export const FLOWYA_PIN_TO_VISIT = 'flowya-pin-to-visit';
export const FLOWYA_PIN_VISITED = 'flowya-pin-visited';
/** Variante reposo: disco sin icono (más discreto). */
export const FLOWYA_PIN_TO_VISIT_DOT = 'flowya-pin-to-visit-dot';
/** Variante reposo: disco sin icono (más discreto). */
export const FLOWYA_PIN_VISITED_DOT = 'flowya-pin-visited-dot';

const ICON_WHITE = '#ffffff';

function createComposedSvg(
  circleFill: string,
  haloStroke: string,
  iconType: 'pin' | 'check' | 'none'
): string {
  const size = MAP_PIN_COMPOSITE_IMAGE_PX;
  const cx = size / 2;
  const cy = size / 2;
  const radius = getCompositeAssetFillRadiusPx();
  if (iconType === 'none') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <circle cx="${cx}" cy="${cy}" r="${radius}" fill="${circleFill}" stroke="${haloStroke}" stroke-width="${MAP_PIN_COMPOSITE_HALO_STROKE_PX}"/>
</svg>`;
  }
  if (iconType === 'pin') {
    const scale = 0.65;
    const tx = cx - 12 * scale;
    const ty = cy - 12 * scale;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <circle cx="${cx}" cy="${cy}" r="${radius}" fill="${circleFill}" stroke="${haloStroke}" stroke-width="${MAP_PIN_COMPOSITE_HALO_STROKE_PX}"/>
  <g transform="translate(${tx}, ${ty}) scale(${scale})" stroke="${ICON_WHITE}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none">
    <path d="M12 17v5"/>
    <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/>
  </g>
</svg>`;
  }

  const checkPath = 'M-6 0 L-2 5 L8 -6';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <circle cx="${cx}" cy="${cy}" r="${radius}" fill="${circleFill}" stroke="${haloStroke}" stroke-width="${MAP_PIN_COMPOSITE_HALO_STROKE_PX}"/>
  <path d="${checkPath}" stroke="${ICON_WHITE}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none" transform="translate(${cx}, ${cy}) scale(0.7)"/>
</svg>`;
}

/** Crea ImageData con círculo + icono (fallback cuando SVG falla). */
function createComposedPinImageDataFallback(
  circleFill: string,
  haloStroke: string,
  iconType: 'pin' | 'check' | 'none'
): ImageData | null {
  if (typeof document === 'undefined') return null;
  const size = MAP_PIN_COMPOSITE_IMAGE_PX;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const cx = size / 2;
  const cy = size / 2;
  const radius = getCompositeAssetFillRadiusPx();
  ctx.clearRect(0, 0, size, size);
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = circleFill;
  ctx.fill();
  ctx.strokeStyle = haloStroke;
  ctx.lineWidth = MAP_PIN_COMPOSITE_HALO_STROKE_PX;
  ctx.stroke();
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = ICON_WHITE;
  if (iconType === 'none') {
    ctx.restore();
    return ctx.getImageData(0, 0, size, size);
  }
  ctx.lineWidth = iconType === 'pin' ? 2 : 2.2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (iconType === 'check') {
    ctx.scale(0.7, 0.7);
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.lineTo(-2, 5);
    ctx.lineTo(8, -6);
    ctx.stroke();
  } else {
    ctx.scale(0.45, 0.45);
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(7, 4);
    ctx.quadraticCurveTo(0, 12, -7, 4);
    ctx.quadraticCurveTo(-10, 0, 0, -10);
    ctx.stroke();
  }
  ctx.restore();
  return ctx.getImageData(0, 0, size, size);
}

/** Añade imagen compuesta al mapa. Colores desde `palette` (light/dark). */
export function addPinStatusImage(map: MapboxMap, id: string, palette: MapPinSpotPalette): void {
  try {
    if (map.hasImage(id)) map.removeImage(id);
  } catch {
    /* ignore */
  }
  const isToVisit = id === FLOWYA_PIN_TO_VISIT || id === FLOWYA_PIN_TO_VISIT_DOT;
  const isVisited = id === FLOWYA_PIN_VISITED || id === FLOWYA_PIN_VISITED_DOT;
  const iconType: 'pin' | 'check' | 'none' =
    id === FLOWYA_PIN_TO_VISIT
      ? 'pin'
      : id === FLOWYA_PIN_VISITED
        ? 'check'
        : 'none';
  const fill = isToVisit ? palette.toVisit.fill : palette.visited.fill;
  const haloStroke = isToVisit ? palette.toVisit.stroke : palette.visited.stroke;

  if (iconType === 'check' || iconType === 'none') {
    const imageData = createComposedPinImageDataFallback(fill, haloStroke, iconType);
    if (imageData) {
      try {
        map.addImage(id, imageData, { pixelRatio: MAP_PIN_COMPOSITE_PIXEL_RATIO });
      } catch {
        /* ignore */
      }
    }
    return;
  }

  const svg = createComposedSvg(fill, haloStroke, 'pin');
  const dataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  const img = typeof document !== 'undefined' ? document.createElement('img') : null;
  if (!img) return;
  img.onload = () => {
    try {
      if (!map.hasImage(id)) map.addImage(id, img, { pixelRatio: MAP_PIN_COMPOSITE_PIXEL_RATIO });
    } catch {
      /* ignore */
    }
  };
  img.onerror = () => {
    const imageData = createComposedPinImageDataFallback(fill, haloStroke, 'pin');
    if (imageData) {
      try {
        if (!map.hasImage(id)) map.addImage(id, imageData, { pixelRatio: MAP_PIN_COMPOSITE_PIXEL_RATIO });
      } catch {
        /* ignore */
      }
    }
  };
  img.src = dataUrl;
}

/** Preload de imágenes compuestas. Llamar al cargar estilo. */
export function preloadPinStatusImages(map: MapboxMap, palette: MapPinSpotPalette = Colors.light.mapPinSpot): void {
  if (typeof document === 'undefined') return;
  addPinStatusImage(map, FLOWYA_PIN_TO_VISIT, palette);
  addPinStatusImage(map, FLOWYA_PIN_VISITED, palette);
  addPinStatusImage(map, FLOWYA_PIN_TO_VISIT_DOT, palette);
  addPinStatusImage(map, FLOWYA_PIN_VISITED_DOT, palette);
}
