import type { VisitedCountriesSharePayload } from "./types";

/**
 * Caché warm **opcional** en memoria (no disco): acelera un segundo compartir con el mismo snapshot
 * sin depender de ningún sheet. Se invalida en cierre de sesión / cambio de cuenta (hosts).
 */
let session: VisitedCountriesSharePayload | null = null;

export function warmVisitedCountriesShareCache(payload: VisitedCountriesSharePayload): void {
  if (!payload.mapSnapshotDataUrl?.trim()) return;
  session = {
    items: payload.items,
    countriesCount: payload.countriesCount,
    spotsCount: payload.spotsCount,
    worldPercentage: payload.worldPercentage,
    mapSnapshotDataUrl: payload.mapSnapshotDataUrl,
  };
}

/** @deprecated Usar `warmVisitedCountriesShareCache` */
export const syncCountriesShareVisitedSession = warmVisitedCountriesShareCache;

export function readVisitedCountriesShareCache(): VisitedCountriesSharePayload | null {
  return session;
}

/** @deprecated Usar `readVisitedCountriesShareCache` */
export const readCountriesShareVisitedSession = readVisitedCountriesShareCache;

export function clearVisitedCountriesShareCache(): void {
  session = null;
}

/** @deprecated Usar `clearVisitedCountriesShareCache` */
export const clearCountriesShareVisitedSession = clearVisitedCountriesShareCache;
