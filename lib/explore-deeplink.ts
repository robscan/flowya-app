/**
 * Deep link canónico: Explore (mapa) + sheet de un spot.
 * Contrato: docs/contracts/DEEP_LINK_SPOT.md
 *
 * sheet=extended → post-edit (guardar): sheet más expandido.
 * sheet=medium   → compartir: sheet estado medio.
 */

const MAP_ROUTE = "/(tabs)";

export type SheetParam = "medium" | "extended";

/**
 * Devuelve la path+query para navegar al mapa con el sheet del spot.
 * - extended: post-edit (tras guardar) → sheet expanded.
 * - medium: share link → sheet medium.
 */
export function getMapSpotDeepLink(
  spotId: string,
  sheet: SheetParam = "extended",
): string {
  const params = new URLSearchParams({ spotId, sheet });
  return `${MAP_ROUTE}?${params.toString()}`;
}

/**
 * URL para compartir: sheet en estado medium (no expanded).
 * Si no hay origin (SSR/entorno sin window), devuelve solo path+query.
 */
export function getMapSpotShareUrl(spotId: string): string {
  const pathQuery = getMapSpotDeepLink(spotId, "medium");
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}${pathQuery}`;
  }
  return pathQuery;
}
