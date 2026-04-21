/**
 * Scope E: compartir spot mediante deep link canónico (Explore + sheet extended).
 * Contrato: docs/contracts/DEEP_LINK_SPOT.md
 * Web Share API si está disponible; si no, copiar link al clipboard.
 */

/**
 * Nota SEO/social cards:
 * Para previsualización (OG) fiable, el link compartido debe apuntar a una ruta “pública” renderizable
 * (p. ej. `/spot/[id]`). Esa página puede redirigir al deep link del mapa para humanos.
 */

function getPublicSpotShareUrl(spotId: string): string {
  const path = `/spot/${encodeURIComponent(spotId)}?open=map`;
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}${path}`;
  }
  return path;
}

export type ShareSpotResult = { copied: boolean };

async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
    return false;
  }
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Comparte un spot: intenta Web Share API; si no está disponible o falla,
 * copia el link al clipboard.
 * Devuelve { copied: true } cuando se copió al portapapeles (para mostrar "Link copiado").
 */
export async function shareSpot(
  spotId: string,
  title?: string | null
): Promise<ShareSpotResult> {
  const url = getPublicSpotShareUrl(spotId);
  const shareTitle = title?.trim() || 'Lugar';

  const canShare =
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    (navigator.canShare?.({ url, title: shareTitle }) ?? true);

  if (canShare) {
    try {
      await navigator.share({
        url,
        title: shareTitle,
      });
      return { copied: false };
    } catch {
      // Usuario canceló o falló share → fallback a copiar
    }
  }

  const copied = await copyToClipboard(url);
  return { copied };
}
