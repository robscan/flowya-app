/**
 * Persistencia local de filtros de Lugares (etiquetas + alcance país / todos).
 * Por usuario autenticado; se aplica en Por visitar / Visitados.
 * Web: lectura síncrona; nativo: AsyncStorage (lectura async tras sesión).
 */

import {
  buildAllPlacesCountryFilter,
  buildSingleCountryFilter,
  normalizeExplorePlacesCountryFilter,
  type CountriesSheetListDetail,
  type ExplorePlacesCountryFilter,
} from "@/components/design-system/countries-sheet-types";
import { getItemAsync, getItemSync, setItem } from "@/lib/storage/kv";

export const EXPLORE_PLACES_FILTERS_SNAPSHOT_VERSION = 2 as const;
const EXPLORE_PLACES_FILTERS_LEGACY_SNAPSHOT_VERSION = 1 as const;

type ExplorePlacesFiltersSnapshotV1 = {
  v: typeof EXPLORE_PLACES_FILTERS_LEGACY_SNAPSHOT_VERSION;
  tagIds: string[];
  country: CountriesSheetListDetail | null;
};

export type ExplorePlacesFiltersSnapshotV2 = {
  v: typeof EXPLORE_PLACES_FILTERS_SNAPSHOT_VERSION;
  tagIds: string[];
  country: ExplorePlacesCountryFilter;
};

function storageKey(userId: string, version: number = EXPLORE_PLACES_FILTERS_SNAPSHOT_VERSION): string {
  return `flowya_explore_places_filters_v${version}_${userId}`;
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

function isExplorePlacesCountryFilter(value: unknown): value is ExplorePlacesCountryFilter {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  if (o.kind === "all_places") return true;
  if (o.kind !== "country_subset" || !Array.isArray(o.countries)) return false;
  return o.countries.every((country) => {
    if (!country || typeof country !== "object") return false;
    const row = country as Record<string, unknown>;
    return typeof row.key === "string" && typeof row.label === "string" && row.key.length > 0;
  });
}

function parseSnapshotV2(raw: string | null): ExplorePlacesFiltersSnapshotV2 | null {
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
    if (c != null && !isExplorePlacesCountryFilter(c)) return null;
    return {
      v: EXPLORE_PLACES_FILTERS_SNAPSHOT_VERSION,
      tagIds: o.tagIds,
      country: normalizeExplorePlacesCountryFilter(
        c == null ? buildAllPlacesCountryFilter() : (c as ExplorePlacesCountryFilter),
      ),
    };
  } catch {
    return null;
  }
}

function parseSnapshotV1(raw: string | null): ExplorePlacesFiltersSnapshotV1 | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const o = parsed as Record<string, unknown>;
    if (o.v !== EXPLORE_PLACES_FILTERS_LEGACY_SNAPSHOT_VERSION) return null;
    if (!Array.isArray(o.tagIds) || !o.tagIds.every((t) => typeof t === "string")) {
      return null;
    }
    const c = o.country;
    if (c != null && !isCountryDetail(c)) return null;
    return {
      v: EXPLORE_PLACES_FILTERS_LEGACY_SNAPSHOT_VERSION,
      tagIds: o.tagIds,
      country: c == null ? null : (c as CountriesSheetListDetail),
    };
  } catch {
    return null;
  }
}

function migrateSnapshotV1(snapshot: ExplorePlacesFiltersSnapshotV1): ExplorePlacesFiltersSnapshotV2 {
  const migratedCountry =
    snapshot.country?.kind === "country"
      ? buildSingleCountryFilter({ key: snapshot.country.key, label: snapshot.country.label })
      : buildAllPlacesCountryFilter();
  return {
    v: EXPLORE_PLACES_FILTERS_SNAPSHOT_VERSION,
    tagIds: snapshot.tagIds,
    country: migratedCountry,
  };
}

function readSnapshotSync(userId: string): ExplorePlacesFiltersSnapshotV2 | null {
  const next = parseSnapshotV2(getItemSync(storageKey(userId)));
  if (next) return next;
  const legacy = parseSnapshotV1(
    getItemSync(storageKey(userId, EXPLORE_PLACES_FILTERS_LEGACY_SNAPSHOT_VERSION)),
  );
  return legacy ? migrateSnapshotV1(legacy) : null;
}

async function readSnapshotAsync(userId: string): Promise<ExplorePlacesFiltersSnapshotV2 | null> {
  const next = parseSnapshotV2(await getItemAsync(storageKey(userId)));
  if (next) return next;
  const legacy = parseSnapshotV1(
    await getItemAsync(storageKey(userId, EXPLORE_PLACES_FILTERS_LEGACY_SNAPSHOT_VERSION)),
  );
  return legacy ? migrateSnapshotV1(legacy) : null;
}

/** Lectura síncrona (web); en nativo suele devolver null hasta `loadExplorePlacesFiltersSnapshotAsync`. */
export function getExplorePlacesFiltersSnapshotSync(userId: string): ExplorePlacesFiltersSnapshotV2 | null {
  return readSnapshotSync(userId);
}

export async function loadExplorePlacesFiltersSnapshotAsync(
  userId: string,
): Promise<ExplorePlacesFiltersSnapshotV2 | null> {
  return readSnapshotAsync(userId);
}

export function setExplorePlacesFiltersSnapshot(
  userId: string,
  snapshot: ExplorePlacesFiltersSnapshotV2,
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
    country: buildAllPlacesCountryFilter(),
  });
}
