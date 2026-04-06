import type { Map as MapboxMap } from 'mapbox-gl';

import { layouts, svgArray } from '@mapbox/maki/browser.esm.js';

import { Colors } from '@/constants/theme';
import type { MapPinSpotPalette } from '@/lib/map-core/map-pin-metrics';

import {
  addPinStatusImage,
  FLOWYA_PIN_TO_VISIT,
  FLOWYA_PIN_VISITED,
} from './pin-status-images';

const FLOWYA_FALLBACK_ICON_RE = /^flowya-fallback-[a-z0-9-]+$/i;
/** Maki ids del sprite Mapbox: park-15, museum-11, etc. Estilos custom pueden no incluirlos. */
const MAKI_SPRITE_ID_RE = /^[a-z0-9_-]+-(11|15)$/i;

const LAYOUT_INDEX = new Map<string, number>();
for (let i = 0; i < layouts.length; i++) {
  LAYOUT_INDEX.set(layouts[i], i);
}

function getMakiSvg(makiId: string): string | null {
  const key = makiId.replace(/_/g, '-');
  const idx = LAYOUT_INDEX.get(key);
  if (idx == null) return null;
  return svgArray[idx] ?? null;
}

function shouldProvideFallbackImage(id: string): boolean {
  if (!id) return false;
  if (id === 'marker-15') return true;
  if (id === FLOWYA_PIN_TO_VISIT || id === FLOWYA_PIN_VISITED) return true;
  if (FLOWYA_FALLBACK_ICON_RE.test(id)) return true;
  if (MAKI_SPRITE_ID_RE.test(id)) return true;
  return false;
}

type FallbackStyle = {
  shape: 'dot' | 'square' | 'diamond';
};

function normalizeMakiId(id: string): string {
  if (FLOWYA_FALLBACK_ICON_RE.test(id)) {
    return id.replace(/^flowya-fallback-/i, '').toLowerCase();
  }
  return id.replace(/-(11|15)$/i, '').toLowerCase();
}

function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function resolveFallbackStyle(id: string): FallbackStyle {
  const key = normalizeMakiId(id);
  const shapes: FallbackStyle['shape'][] = ['dot', 'square', 'diamond'];
  const hash = hashString(key);
  const shape = shapes[hash % shapes.length];
  return { shape };
}

function drawCenterShape(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  style: FallbackStyle
): void {
  const half = size / 2;
  ctx.save();
  ctx.fillStyle = '#FFFFFF';
  if (style.shape === 'dot') {
    ctx.beginPath();
    ctx.arc(cx, cy, half, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }
  if (style.shape === 'square') {
    ctx.fillRect(cx - half, cy - half, size, size);
    ctx.restore();
    return;
  }
  ctx.beginPath();
  ctx.moveTo(cx, cy - half);
  ctx.lineTo(cx + half, cy);
  ctx.lineTo(cx, cy + half);
  ctx.lineTo(cx - half, cy);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function createGenericFallbackImage(id: string, sizePx = 32): ImageData | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = sizePx;
  canvas.height = sizePx;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const style = resolveFallbackStyle(id);
  const cx = sizePx / 2;
  const cy = sizePx / 2;
  const radius = sizePx * 0.26;
  ctx.clearRect(0, 0, sizePx, sizePx);
  drawCenterShape(ctx, cx, cy, radius * 1.1, style);
  return ctx.getImageData(0, 0, sizePx, sizePx);
}

/** Añade icono Maki real (park, museum, etc.) o fallback genérico. */
function addFallbackImage(map: MapboxMap, id: string, mapPinPalette: MapPinSpotPalette): void {
  try {
    if (id === FLOWYA_PIN_TO_VISIT || id === FLOWYA_PIN_VISITED) {
      addPinStatusImage(map, id, mapPinPalette);
      return;
    }

    if (map.hasImage(id)) return;

    const makiKey = normalizeMakiId(id);
    const svg = getMakiSvg(makiKey);

    if (svg && typeof document !== 'undefined') {
      const img = document.createElement('img');
      const svgWhite = svg.replace(/<svg /, '<svg fill="#FFFFFF" ');
      const dataUrl = `data:image/svg+xml;base64,${btoa(svgWhite)}`;
      img.onload = () => {
        try {
          if (!map.hasImage(id)) map.addImage(id, img, { pixelRatio: 2 });
        } catch {
          /* ignore */
        }
      };
      img.onerror = () => {
        const fallback = createGenericFallbackImage(id);
        if (fallback) map.addImage(id, fallback, { pixelRatio: 2 });
      };
      img.src = dataUrl;
      return;
    }

    const imageData = createGenericFallbackImage(id);
    if (imageData) map.addImage(id, imageData, { pixelRatio: 2 });
  } catch {
    /* ignore */
  }
}

const FALLBACK_IDS_TO_PRELOAD = [
  'marker-15',
  'flowya-fallback-generic',
  'flowya-fallback-park',
  'flowya-fallback-museum',
  'flowya-fallback-monument',
  FLOWYA_PIN_TO_VISIT,
  FLOWYA_PIN_VISITED,
];

export function installStyleImageFallback(
  map: MapboxMap,
  options?: { mapPinPalette?: MapPinSpotPalette }
): () => void {
  const mapPinPalette = options?.mapPinPalette ?? Colors.light.mapPinSpot;
  if (typeof document !== 'undefined') {
    for (const id of FALLBACK_IDS_TO_PRELOAD) {
      addFallbackImage(map, id, mapPinPalette);
    }
  }
  const onStyleImageMissing = (e: { id?: string }) => {
    const id = typeof e?.id === 'string' ? e.id : '';
    if (!shouldProvideFallbackImage(id)) return;
    try {
      if (id !== FLOWYA_PIN_TO_VISIT && id !== FLOWYA_PIN_VISITED && map.hasImage(id)) return;
      addFallbackImage(map, id, mapPinPalette);
    } catch {
      /* ignore */
    }
  };

  map.on('styleimagemissing', onStyleImageMissing);
  return () => {
    try {
      map.off('styleimagemissing', onStyleImageMissing);
    } catch {
      /* ignore */
    }
  };
}
