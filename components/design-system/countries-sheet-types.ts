/** Tipos compartidos del sheet de países (Explore). */

export type CountriesSheetState = 'peek' | 'medium' | 'expanded';

export type CountrySheetItem = {
  key: string;
  label: string;
  count: number;
};

/**
 * Vista de listado dentro del sheet (mismo template: cabecera atrás + chips + lista).
 * `country`: spots de ese país; `all_places`: todos los lugares del pool del overlay (mismo criterio que buckets).
 */
export type CountriesSheetListDetail =
  | { kind: "country"; key: string; label: string }
  | { kind: "all_places" };

export type ExplorePlacesCountryFilterCountry = {
  key: string;
  label: string;
};

/**
 * Filtro de datos para Explore/Lugares.
 * Separado de `CountriesSheetListDetail` porque el sheet necesita navegar entre KPI/listado/atrás
 * y el filtro puede abarcar uno o varios países sin cambiar esa ruta visual.
 */
export type ExplorePlacesCountryFilter =
  | { kind: "all_places" }
  | { kind: "country_subset"; countries: ExplorePlacesCountryFilterCountry[] };

function dedupeCountries(
  countries: readonly ExplorePlacesCountryFilterCountry[],
): ExplorePlacesCountryFilterCountry[] {
  const seen = new Set<string>();
  const out: ExplorePlacesCountryFilterCountry[] = [];
  for (const country of countries) {
    if (seen.has(country.key)) continue;
    seen.add(country.key);
    out.push({ key: country.key, label: country.label });
  }
  return out;
}

export function buildAllPlacesCountryFilter(): ExplorePlacesCountryFilter {
  return { kind: "all_places" };
}

export function buildSingleCountryFilter(
  country: ExplorePlacesCountryFilterCountry,
): ExplorePlacesCountryFilter {
  return {
    kind: "country_subset",
    countries: [{ key: country.key, label: country.label }],
  };
}

export function normalizeExplorePlacesCountryFilter(
  filter: ExplorePlacesCountryFilter | null | undefined,
  availableCountries?: readonly Pick<CountrySheetItem, "key" | "label">[],
): ExplorePlacesCountryFilter {
  if (!filter || filter.kind === "all_places") {
    return buildAllPlacesCountryFilter();
  }
  const uniqueCountries = dedupeCountries(filter.countries);
  if (uniqueCountries.length === 0) {
    return buildAllPlacesCountryFilter();
  }
  if (!availableCountries || availableCountries.length === 0) {
    return { kind: "country_subset", countries: uniqueCountries };
  }
  const selectedKeys = new Set(uniqueCountries.map((country) => country.key));
  const nextCountries = availableCountries
    .filter((country) => selectedKeys.has(country.key))
    .map((country) => ({ key: country.key, label: country.label }));
  if (nextCountries.length === 0 || nextCountries.length >= availableCountries.length) {
    return buildAllPlacesCountryFilter();
  }
  return { kind: "country_subset", countries: nextCountries };
}

export function toggleExplorePlacesCountryFilterCountry(
  filter: ExplorePlacesCountryFilter | null | undefined,
  country: ExplorePlacesCountryFilterCountry,
  availableCountries?: readonly Pick<CountrySheetItem, "key" | "label">[],
): ExplorePlacesCountryFilter {
  const normalized = normalizeExplorePlacesCountryFilter(filter, availableCountries);
  if (normalized.kind === "all_places") {
    return normalizeExplorePlacesCountryFilter(buildSingleCountryFilter(country), availableCountries);
  }
  const isSelected = normalized.countries.some((item) => item.key === country.key);
  const nextCountries = isSelected
    ? normalized.countries.filter((item) => item.key !== country.key)
    : [...normalized.countries, { key: country.key, label: country.label }];
  return normalizeExplorePlacesCountryFilter(
    { kind: "country_subset", countries: nextCountries },
    availableCountries,
  );
}

export function isExplorePlacesCountryFilterActive(
  filter: ExplorePlacesCountryFilter | null | undefined,
): boolean {
  return normalizeExplorePlacesCountryFilter(filter).kind === "country_subset";
}

export function explorePlacesCountryFilterIncludes(
  filter: ExplorePlacesCountryFilter | null | undefined,
  countryKey: string | null | undefined,
): boolean {
  const normalized = normalizeExplorePlacesCountryFilter(filter);
  if (normalized.kind === "all_places") return true;
  if (!countryKey) return false;
  return normalized.countries.some((country) => country.key === countryKey);
}

export function getExplorePlacesCountryFilterSummaryLabel(
  filter: ExplorePlacesCountryFilter | null | undefined,
): string | null {
  const normalized = normalizeExplorePlacesCountryFilter(filter);
  if (normalized.kind === "all_places") return null;
  if (normalized.countries.length === 1) {
    return normalized.countries[0]?.label ?? null;
  }
  return `${normalized.countries.length} países`;
}

export function areExplorePlacesCountryFiltersEqual(
  a: ExplorePlacesCountryFilter | null | undefined,
  b: ExplorePlacesCountryFilter | null | undefined,
): boolean {
  const left = normalizeExplorePlacesCountryFilter(a);
  const right = normalizeExplorePlacesCountryFilter(b);
  if (left.kind !== right.kind) return false;
  if (left.kind === "all_places" || right.kind === "all_places") return true;
  if (left.countries.length !== right.countries.length) return false;
  return left.countries.every(
    (country, index) =>
      country.key === right.countries[index]?.key && country.label === right.countries[index]?.label,
  );
}
