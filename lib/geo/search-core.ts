import { normalizeSearchText, tokenizeSearchText } from "../search/intent-normalize.ts";

import type {
  GeoAliasRow,
  GeoBoundingBox,
  GeoCityRow,
  GeoCountryRow,
  GeoEntityType,
  GeoRegionRow,
  GeoSearchResult,
  UserGeoMarkRow,
} from "./types";

type GeoCandidate = Omit<GeoSearchResult, "score"> & {
  searchText: string;
  primaryAliasText: string;
};

export type GeoSearchRows = {
  countries: GeoCountryRow[];
  regions: GeoRegionRow[];
  cities: GeoCityRow[];
  aliases: GeoAliasRow[];
  marks?: UserGeoMarkRow[];
};

const TYPE_WEIGHT: Record<GeoEntityType, number> = {
  country: 12,
  region: 8,
  city: 4,
};

export function parseGeoBoundingBox(value: unknown): GeoBoundingBox | null {
  if (typeof value !== "object" || value == null) return null;
  const record = value as Partial<Record<keyof GeoBoundingBox, unknown>>;
  const west = Number(record.west);
  const south = Number(record.south);
  const east = Number(record.east);
  const north = Number(record.north);
  if (![west, south, east, north].every(Number.isFinite)) return null;
  if (west < -180 || east > 180 || south < -90 || north > 90) return null;
  if (west >= east || south >= north) return null;
  return { west, south, east, north };
}

export function buildGeoSearchResults(rows: GeoSearchRows, query: string, limit = 12): GeoSearchResult[] {
  const normalizedQuery = normalizeSearchText(query);
  const tokens = tokenizeSearchText(normalizedQuery);
  if (!normalizedQuery || tokens.length === 0) return [];

  return buildGeoCandidates(rows)
    .map((candidate) => ({
      ...candidate,
      score: scoreGeoCandidate(candidate, normalizedQuery, tokens),
    }))
    .filter((result) => result.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (TYPE_WEIGHT[b.entityType] !== TYPE_WEIGHT[a.entityType]) {
        return TYPE_WEIGHT[b.entityType] - TYPE_WEIGHT[a.entityType];
      }
      return a.title.localeCompare(b.title, "es");
    })
    .slice(0, limit);
}

function buildGeoCandidates(rows: GeoSearchRows): GeoCandidate[] {
  const aliasesByEntity = groupAliases(rows.aliases);
  const marksByEntity = groupMarks(rows.marks ?? []);
  const countriesById = new Map(rows.countries.map((country) => [country.id, country]));
  const regionsById = new Map(rows.regions.map((region) => [region.id, region]));

  const countries = rows.countries.map((country) => {
    const aliases = aliasesByEntity.get(entityKey("country", country.id)) ?? [];
    const mark = marksByEntity.get(entityKey("country", country.id));
    return buildCandidate({
      entityType: "country",
      id: country.id,
      title: country.name_es,
      subtitle: country.iso2,
      slug: country.slug,
      centroidLatitude: country.centroid_latitude,
      centroidLongitude: country.centroid_longitude,
      bbox: parseGeoBoundingBox(country.bbox),
      aliases: compactUnique([country.name_es, country.name_en, country.iso2, country.iso3, country.slug, ...aliases]),
      saved: mark?.saved ?? false,
      visited: mark?.visited ?? false,
    });
  });

  const regions = rows.regions.map((region) => {
    const country = countriesById.get(region.country_id);
    const aliases = aliasesByEntity.get(entityKey("region", region.id)) ?? [];
    const mark = marksByEntity.get(entityKey("region", region.id));
    return buildCandidate({
      entityType: "region",
      id: region.id,
      title: region.name_es,
      subtitle: compactUnique([country?.name_es, country?.iso2]).join(" · "),
      slug: region.slug,
      countryId: region.country_id,
      centroidLatitude: region.centroid_latitude,
      centroidLongitude: region.centroid_longitude,
      bbox: parseGeoBoundingBox(region.bbox),
      aliases: compactUnique([
        region.name_es,
        region.name_en,
        region.region_code,
        region.slug,
        country?.name_es,
        country?.name_en,
        ...aliases,
      ]),
      saved: mark?.saved ?? false,
      visited: mark?.visited ?? false,
    });
  });

  const cities = rows.cities.map((city) => {
    const country = countriesById.get(city.country_id);
    const region = city.region_id ? regionsById.get(city.region_id) : null;
    const aliases = aliasesByEntity.get(entityKey("city", city.id)) ?? [];
    const mark = marksByEntity.get(entityKey("city", city.id));
    return buildCandidate({
      entityType: "city",
      id: city.id,
      title: city.name_es,
      subtitle: compactUnique([region?.name_es, country?.name_es]).join(" · "),
      slug: city.slug,
      countryId: city.country_id,
      regionId: city.region_id,
      centroidLatitude: city.centroid_latitude,
      centroidLongitude: city.centroid_longitude,
      bbox: parseGeoBoundingBox(city.bbox),
      aliases: compactUnique([
        city.official_name,
        city.name_es,
        city.name_en,
        city.slug,
        region?.name_es,
        country?.name_es,
        country?.name_en,
        ...aliases,
      ]),
      saved: mark?.saved ?? false,
      visited: mark?.visited ?? false,
    });
  });

  return [...countries, ...regions, ...cities];
}

function buildCandidate(input: Omit<GeoSearchResult, "kind" | "score">): GeoCandidate {
  const normalizedAliases = input.aliases.map(normalizeSearchText).filter(Boolean);
  return {
    kind: "geo",
    ...input,
    searchText: compactUnique([...normalizedAliases, input.title, input.subtitle, input.slug].map(normalizeSearchText)).join(" "),
    primaryAliasText: normalizeSearchText(input.title),
  };
}

function scoreGeoCandidate(candidate: GeoCandidate, normalizedQuery: string, tokens: string[]): number {
  const typeWeight = TYPE_WEIGHT[candidate.entityType];
  if (candidate.primaryAliasText === normalizedQuery) return 120 + typeWeight;
  if (candidate.aliases.some((alias) => normalizeSearchText(alias) === normalizedQuery)) return 112 + typeWeight;
  if (candidate.primaryAliasText.startsWith(normalizedQuery)) return 92 + typeWeight;
  if (candidate.searchText.includes(normalizedQuery)) return 74 + typeWeight;
  if (tokens.every((token) => candidate.searchText.includes(token))) return 64 + typeWeight;
  if (tokens.some((token) => token.length >= 4 && candidate.searchText.includes(token))) return 38 + typeWeight;
  return 0;
}

function groupAliases(rows: GeoAliasRow[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const row of rows) {
    if (row.entity_type !== "country" && row.entity_type !== "region" && row.entity_type !== "city") continue;
    const key = entityKey(row.entity_type, row.entity_id);
    const list = map.get(key) ?? [];
    list.push(row.name, row.normalized_name);
    map.set(key, list);
  }
  return map;
}

function groupMarks(rows: UserGeoMarkRow[]): Map<string, Pick<UserGeoMarkRow, "saved" | "visited">> {
  const map = new Map<string, Pick<UserGeoMarkRow, "saved" | "visited">>();
  for (const row of rows) {
    if (row.entity_type !== "country" && row.entity_type !== "region" && row.entity_type !== "city") continue;
    map.set(entityKey(row.entity_type, row.entity_id), {
      saved: row.saved,
      visited: row.visited,
    });
  }
  return map;
}

function entityKey(entityType: GeoEntityType, entityId: string): string {
  return `${entityType}:${entityId}`;
}

function compactUnique(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const normalized = value?.trim();
    if (!normalized) continue;
    const key = normalizeSearchText(normalized);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(normalized);
  }
  return result;
}
