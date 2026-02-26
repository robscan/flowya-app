import type { Map as MapboxMap } from 'mapbox-gl';

const FLOWYA_FALLBACK_ICON_RE = /^flowya-fallback-[a-z0-9-]+$/i;

function shouldProvideFallbackImage(id: string): boolean {
  if (!id) return false;
  if (id === 'marker-15') return true;
  if (FLOWYA_FALLBACK_ICON_RE.test(id)) return true;
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
  // diamond
  ctx.beginPath();
  ctx.moveTo(cx, cy - half);
  ctx.lineTo(cx + half, cy);
  ctx.lineTo(cx, cy + half);
  ctx.lineTo(cx - half, cy);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function createFallbackImage(id: string, sizePx = 32): ImageData | null {
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

  // White-only fallback glyph over pin circle background.
  ctx.clearRect(0, 0, sizePx, sizePx);
  drawCenterShape(ctx, cx, cy, radius * 1.1, style);

  return ctx.getImageData(0, 0, sizePx, sizePx);
}

export function installStyleImageFallback(map: MapboxMap): () => void {
  const onStyleImageMissing = (e: { id?: string }) => {
    const id = typeof e?.id === 'string' ? e.id : '';
    if (!shouldProvideFallbackImage(id)) return;
    try {
      if (map.hasImage(id)) return;
      const imageData = createFallbackImage(id, 32);
      if (!imageData) return;
      map.addImage(id, imageData, { pixelRatio: 2 });
    } catch {
      // ignore addImage races/style swaps
    }
  };

  map.on('styleimagemissing', onStyleImageMissing);
  return () => {
    try {
      map.off('styleimagemissing', onStyleImageMissing);
    } catch {
      // ignore
    }
  };
}
