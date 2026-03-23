/**
 * Persistencia local de badges pendientes del filtro de pines en mapa.
 * Alcance: UX local por dispositivo/navegador (no sincroniza backend).
 */

import { getItemAsync, getItemSync, setItem } from "@/lib/storage/kv";

const STORAGE_KEY = "flowya_map_pin_pending_badges";

export type MapPinPendingBadges = {
  saved: boolean;
  visited: boolean;
};

const DEFAULT_BADGES: MapPinPendingBadges = {
  saved: false,
  visited: false,
};

function parseBadges(raw: string | null): MapPinPendingBadges {
  if (!raw) return DEFAULT_BADGES;
  try {
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

/** Nativo: hasta `loadMapPinPendingBadgesAsync` puede devolver defaults. */
export function getMapPinPendingBadges(): MapPinPendingBadges {
  return parseBadges(getItemSync(STORAGE_KEY));
}

export async function loadMapPinPendingBadgesAsync(): Promise<MapPinPendingBadges> {
  const raw = await getItemAsync(STORAGE_KEY);
  return parseBadges(raw);
}

export function setMapPinPendingBadges(next: MapPinPendingBadges): void {
  try {
    setItem(
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
