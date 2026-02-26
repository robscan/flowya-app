/**
 * Persistencia local de badges pendientes del filtro de pines en mapa.
 * Alcance: UX local por dispositivo/navegador (no sincroniza backend).
 */

const STORAGE_KEY = "flowya_map_pin_pending_badges";

export type MapPinPendingBadges = {
  saved: boolean;
  visited: boolean;
};

const DEFAULT_BADGES: MapPinPendingBadges = {
  saved: false,
  visited: false,
};

export function getMapPinPendingBadges(): MapPinPendingBadges {
  if (typeof localStorage === "undefined") return DEFAULT_BADGES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_BADGES;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return DEFAULT_BADGES;
    const candidate = parsed as Partial<MapPinPendingBadges>;
    return {
      saved: Boolean(candidate.saved),
      visited: Boolean(candidate.visited),
    };
  } catch {
    return DEFAULT_BADGES;
  }
}

export function setMapPinPendingBadges(next: MapPinPendingBadges): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        saved: Boolean(next.saved),
        visited: Boolean(next.visited),
      }),
    );
  } catch {
    // ignore
  }
}
