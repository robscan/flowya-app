/**
 * Persistencia local de filtros de Lugares (etiquetas + alcance país / todos).
 * Por usuario autenticado; se aplica en Por visitar / Visitados.
 * Web: lectura síncrona; nativo: AsyncStorage (lectura async tras sesión).
 */

import type { CountriesSheetListDetail } from "@/components/design-system/countries-sheet-types";
import { getItemAsync, getItemSync, setItem } from "@/lib/storage/kv";

export const EXPLORE_PLACES_FILTERS_SNAPSHOT_VERSION = 1 as const;

export type ExplorePlacesFiltersSnapshotV1 = {
  v: typeof EXPLORE_PLACES_FILTERS_SNAPSHOT_VERSION;
  tagIds: string[];
  country: CountriesSheetListDetail | null;
};

function storageKey(userId: string): string {
  return `flowya_explore_places_filters_v${EXPLORE_PLACES_FILTERS_SNAPSHOT_VERSION}_${userId}`;
}

function isCountryDetail(value: unknown): value is CountriesSheetListDetail {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  if (o.kind === "all_places") return true;
  if (o.kind === "country") {
    return typeof o.key === "string" && typeof o.label === "string" && o.key.length > 0;
  }
  return false;
}

function parseSnapshot(raw: string | null): ExplorePlacesFiltersSnapshotV1 | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const o = parsed as Record<string, unknown>;
    if (o.v !== EXPLORE_PLACES_FILTERS_SNAPSHOT_VERSION) return null;
    if (!Array.isArray(o.tagIds) || !o.tagIds.every((t) => typeof t === "string")) {
      return null;
    }
    const c = o.country;
    if (c != null && !isCountryDetail(c)) return null;
    return {
      v: EXPLORE_PLACES_FILTERS_SNAPSHOT_VERSION,
      tagIds: o.tagIds,
      country: c == null ? null : (c as CountriesSheetListDetail),
    };
  } catch {
    return null;
  }
}

/** Lectura síncrona (web); en nativo suele devolver null hasta `loadExplorePlacesFiltersSnapshotAsync`. */
export function getExplorePlacesFiltersSnapshotSync(userId: string): ExplorePlacesFiltersSnapshotV1 | null {
  return parseSnapshot(getItemSync(storageKey(userId)));
}

export async function loadExplorePlacesFiltersSnapshotAsync(
  userId: string,
): Promise<ExplorePlacesFiltersSnapshotV1 | null> {
  const raw = await getItemAsync(storageKey(userId));
  return parseSnapshot(raw);
}

export function setExplorePlacesFiltersSnapshot(
  userId: string,
  snapshot: ExplorePlacesFiltersSnapshotV1,
): void {
  try {
    setItem(storageKey(userId), JSON.stringify(snapshot));
  } catch {
    /* ignore */
  }
}

/** Borra preferencias persistidas (logout o filtro «Todos»). */
export function clearExplorePlacesFiltersSnapshot(userId: string): void {
  setExplorePlacesFiltersSnapshot(userId, {
    v: EXPLORE_PLACES_FILTERS_SNAPSHOT_VERSION,
    tagIds: [],
    country: null,
  });
}
