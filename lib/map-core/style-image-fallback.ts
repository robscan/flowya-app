import type { Map as MapboxMap } from 'mapbox-gl';

const MAKI_ICON_RE = /^[a-z0-9-]+-(11|15)$/i;

function shouldProvideFallbackImage(id: string): boolean {
  if (!id) return false;
  if (id === 'marker-15') return true;
  return MAKI_ICON_RE.test(id);
}

function createFallbackImage(sizePx = 32): ImageData | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = sizePx;
  canvas.height = sizePx;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const cx = sizePx / 2;
  const cy = sizePx / 2;
  const radius = sizePx * 0.33;

  // Minimal neutral marker fallback (no plus).
  ctx.clearRect(0, 0, sizePx, sizePx);
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(20, 20, 24, 0.92)';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.42, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  return ctx.getImageData(0, 0, sizePx, sizePx);
}

export function installStyleImageFallback(map: MapboxMap): () => void {
  const onStyleImageMissing = (e: { id?: string }) => {
    const id = typeof e?.id === 'string' ? e.id : '';
    if (!shouldProvideFallbackImage(id)) return;
    try {
      if (map.hasImage(id)) return;
      const imageData = createFallbackImage(32);
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
