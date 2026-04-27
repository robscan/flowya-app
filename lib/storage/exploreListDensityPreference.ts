/**
 * Preferencia local de densidad de listados Explore.
 * Es una preferencia de UI, no un filtro de datos: no afecta queries ni visibilidad de pines.
 */

import { getItemAsync, getItemSync, setItem } from "@/lib/storage/kv";

export type ExploreListDensity = "detail" | "compact" | "simple";

const STORAGE_KEY = "flowya_explore_list_density_v1";
const DEFAULT_DENSITY: ExploreListDensity = "detail";

function parseExploreListDensity(value: string | null): ExploreListDensity | null {
  if (value === "detail" || value === "compact" || value === "simple") return value;
  return null;
}

export function getExploreListDensityPreferenceSync(): ExploreListDensity {
  return parseExploreListDensity(getItemSync(STORAGE_KEY)) ?? DEFAULT_DENSITY;
}

export async function loadExploreListDensityPreferenceAsync(): Promise<ExploreListDensity> {
  return parseExploreListDensity(await getItemAsync(STORAGE_KEY)) ?? DEFAULT_DENSITY;
}

export function setExploreListDensityPreference(value: ExploreListDensity): void {
  setItem(STORAGE_KEY, value);
}
