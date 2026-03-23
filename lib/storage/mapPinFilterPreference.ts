/**
 * Persistencia local del filtro de pins en Explore.
 * Retiene la última selección del usuario: all | saved | visited.
 * Web: lectura síncrona desde localStorage; nativo: AsyncStorage (lectura async en mount).
 */

import { getItemAsync, getItemSync, setItem } from "@/lib/storage/kv";

const STORAGE_KEY = "flowya_map_pin_filter_preference";

export type MapPinFilterPreference = "all" | "saved" | "visited";

function isValidFilter(value: unknown): value is MapPinFilterPreference {
  return value === "all" || value === "saved" || value === "visited";
}

function parsePreference(raw: string | null): MapPinFilterPreference {
  if (!raw) return "all";
  try {
    const parsed = JSON.parse(raw) as unknown;
    return isValidFilter(parsed) ? parsed : "all";
  } catch {
    return "all";
  }
}

/** Lectura síncrona (solo web tiene valor; en nativo devuelve `all` hasta hidratar con `loadMapPinFilterPreferenceAsync`). */
export function getMapPinFilterPreference(): MapPinFilterPreference {
  return parsePreference(getItemSync(STORAGE_KEY));
}

export async function loadMapPinFilterPreferenceAsync(): Promise<MapPinFilterPreference> {
  const raw = await getItemAsync(STORAGE_KEY);
  return parsePreference(raw);
}

export function setMapPinFilterPreference(next: MapPinFilterPreference): void {
  try {
    setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}
