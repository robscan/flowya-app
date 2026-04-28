export type GeoEntityType = "country" | "region" | "city";

export type UserGeoMarkState = "saved" | "visited";

export type GeoBoundingBox = {
  west: number;
  south: number;
  east: number;
  north: number;
};

export type GeoSearchResult = {
  kind: "geo";
  entityType: GeoEntityType;
  id: string;
  title: string;
  subtitle: string;
  slug: string;
  countryId?: string | null;
  regionId?: string | null;
  centroidLatitude: number | null;
  centroidLongitude: number | null;
  bbox: GeoBoundingBox | null;
  aliases: string[];
  saved: boolean;
  visited: boolean;
  score: number;
};

export type GeoAliasRow = {
  entity_type: string;
  entity_id: string;
  name: string;
  normalized_name: string;
  is_primary: boolean;
};

export type GeoCountryRow = {
  id: string;
  iso2: string;
  iso3: string | null;
  name_es: string;
  name_en: string;
  slug: string;
  centroid_latitude: number | null;
  centroid_longitude: number | null;
  bbox: unknown;
};

export type GeoRegionRow = {
  id: string;
  country_id: string;
  region_code: string | null;
  name_es: string;
  name_en: string;
  slug: string;
  region_type: string;
  centroid_latitude: number | null;
  centroid_longitude: number | null;
  bbox: unknown;
};

export type GeoCityRow = {
  id: string;
  country_id: string;
  region_id: string | null;
  official_name: string;
  name_es: string;
  name_en: string;
  slug: string;
  city_type: string;
  centroid_latitude: number | null;
  centroid_longitude: number | null;
  bbox: unknown;
};

export type UserGeoMarkRow = {
  entity_type: string;
  entity_id: string;
  saved: boolean;
  visited: boolean;
};

export function isGeoEntityType(value: unknown): value is GeoEntityType {
  return value === "country" || value === "region" || value === "city";
}

export function isGeoSearchResult(value: unknown): value is GeoSearchResult {
  if (typeof value !== "object" || value == null) return false;
  const record = value as Partial<GeoSearchResult>;
  return record.kind === "geo" && isGeoEntityType(record.entityType) && typeof record.id === "string";
}
