import type { SpotPinStatus } from "@/components/design-system/map-pins";
import { buildCountryBuckets, type CountryBucket } from "@/lib/explore/country-bucket-metrics";

export type VisitedCountriesShareBaseline = {
  items: CountryBucket[];
  /** ISO2 para `CountriesMapPreview` (mismo criterio que `CountriesSheet`). */
  countryCodes: string[];
  countriesCount: number;
  spotsCount: number;
  worldPercentage: number;
};

/**
 * Métricas + items para `shareCountriesCard` visitados, alineados con
 * `buildCountryBuckets` + KPIs de perfil (`visitedPlacesCount` = cardinal visitados).
 */
export function buildVisitedCountriesShareBaselineFromSpots(
  spots: Array<{ address: string | null | undefined; pinStatus?: SpotPinStatus }>,
): VisitedCountriesShareBaseline | null {
  const visited = spots.filter((s) => s.pinStatus === "visited");
  if (visited.length === 0) return null;
  const items = buildCountryBuckets(visited);
  const countryCodes = items
    .map((item) => item.key.match(/^iso:([A-Z]{2})$/)?.[1] ?? null)
    .filter((code): code is string => code != null);
  const countriesCount = items.length;
  const spotsCount = visited.length;
  const worldPercentage = Math.round((countriesCount / 195) * 100);
  return { items, countryCodes, countriesCount, spotsCount, worldPercentage };
}
