/**
 * Últimos spots abiertos desde search (máx 10). Para sección "Vistos recientemente".
 */

import { Platform } from "react-native";

import { getItemAsync, getItemSync, setItem } from "@/lib/storage/kv";

const STORAGE_KEY = "flowya_recent_viewed_spot_ids";
const MAX_ITEMS = 10;

function parseIds(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string").slice(0, MAX_ITEMS);
  } catch {
    return [];
  }
}

/** Lectura síncrona (web); en nativo suele ser [] hasta hidratar. */
export function getRecentViewedSpotIds(): string[] {
  return parseIds(getItemSync(STORAGE_KEY));
}

export async function loadRecentViewedSpotIdsAsync(): Promise<string[]> {
  const raw = await getItemAsync(STORAGE_KEY);
  return parseIds(raw);
}

export function addRecentViewedSpotId(spotId: string): void {
  if (!spotId) return;
  if (Platform.OS === "web") {
    const list = getRecentViewedSpotIds();
    const without = list.filter((id) => id !== spotId);
    const next = [spotId, ...without].slice(0, MAX_ITEMS);
    try {
      setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
    return;
  }
  void addRecentViewedSpotIdAsync(spotId);
}

/** Persistencia nativa: lee lista previa de AsyncStorage antes de fusionar. */
export async function addRecentViewedSpotIdAsync(spotId: string): Promise<void> {
  if (!spotId) return;
  const list = await loadRecentViewedSpotIdsAsync();
  const without = list.filter((id) => id !== spotId);
  const next = [spotId, ...without].slice(0, MAX_ITEMS);
  try {
    setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}
