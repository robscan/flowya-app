/**
 * Compartir enlace a Explorar (mapa) sin spot; misma estrategia que share-spot (Web Share → portapapeles).
 */

import { getMapExploreShareUrl } from "@/lib/explore-deeplink";

export type ShareExploreMapResult = { copied: boolean };

async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
    return false;
  }
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export async function shareExploreMap(): Promise<ShareExploreMapResult> {
  const url = getMapExploreShareUrl();
  const title = "Flowya — Explorar";

  const canShare =
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    (navigator.canShare?.({ url, title }) ?? true);

  if (canShare) {
    try {
      await navigator.share({ url, title });
      return { copied: false };
    } catch {
      // cancelado o error → portapapeles
    }
  }

  const copied = await copyToClipboard(url);
  return { copied };
}
