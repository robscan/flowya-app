/**
 * Persistencia local del filtro de pins en Explore.
 * Retiene la última selección del usuario: all | saved | visited.
 */

const STORAGE_KEY = "flowya_map_pin_filter_preference";

export type MapPinFilterPreference = "all" | "saved" | "visited";

function isValidFilter(value: unknown): value is MapPinFilterPreference {
  return value === "all" || value === "saved" || value === "visited";
}

export function getMapPinFilterPreference(): MapPinFilterPreference {
  if (typeof localStorage === "undefined") return "all";
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return "all";
    const parsed = JSON.parse(raw) as unknown;
    return isValidFilter(parsed) ? parsed : "all";
  } catch {
    return "all";
  }
}

export function setMapPinFilterPreference(next: MapPinFilterPreference): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

