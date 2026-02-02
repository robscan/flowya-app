/**
 * Scope C: optimización de imagen de portada para web.
 * Redimensiona (max width) y comprime antes de subir.
 * Solo se ejecuta en web (canvas). En native se sube el blob original.
 */

import { Platform } from 'react-native';

const MAX_WIDTH = 1600;
const JPEG_QUALITY = 0.75;
const TARGET_MAX_BYTES = 500 * 1024;

export type OptimizeResult = { blob: Blob; ok: true } | { ok: false; fallbackBlob?: Blob };

/**
 * Optimiza imagen para web: resize (mantiene proporción, max 1600px) + JPEG ~75%.
 * Si falla, devuelve ok: false con fallbackBlob para subir original.
 */
export async function optimizeSpotImage(file: Blob): Promise<OptimizeResult> {
  if (Platform.OS !== 'web') {
    return { blob: file, ok: true };
  }

  try {
    const blob = await optimizeInBrowser(file);
    return blob ? { blob, ok: true } : { ok: false, fallbackBlob: file };
  } catch {
    return { ok: false, fallbackBlob: file };
  }
}

function loadImageAsBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Image load failed'));
    };
    img.src = url;
  });
}

function optimizeInBrowser(file: Blob): Promise<Blob | null> {
  return new Promise((resolve, reject) => {
    loadImageAsBlob(file)
      .then((img) => {
        const { width, height } = img;
        const scale = width > MAX_WIDTH ? MAX_WIDTH / width : 1;
        const w = Math.round(width * scale);
        const h = Math.round(height * scale);

        const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
        if (!canvas) {
          resolve(null);
          return;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);

        canvas.toBlob(
          (out) => {
            if (!out) {
              resolve(null);
              return;
            }
            if (out.size <= TARGET_MAX_BYTES) {
              resolve(out);
              return;
            }
            canvas.toBlob(
              (smaller) => resolve(smaller || out),
              'image/jpeg',
              0.7
            );
          },
          'image/jpeg',
          JPEG_QUALITY
        );
      })
      .catch(reject);
  });
}
