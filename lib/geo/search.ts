import { getSupabaseClient, hasSupabaseClientEnv } from "@/lib/supabase";

import { buildGeoSearchResults, type GeoSearchRows } from "./search-core";
import type {
  GeoAliasRow,
  GeoCityRow,
  GeoCountryRow,
  GeoRegionRow,
  GeoSearchResult,
  UserGeoMarkRow,
} from "./types";

export type SearchGeoEntitiesOptions = {
  limit?: number;
  includeUserMarks?: boolean;
};

export async function searchGeoEntities(
  query: string,
  options: SearchGeoEntitiesOptions = {},
): Promise<GeoSearchResult[]> {
  const normalizedQuery = query.trim();
  if (normalizedQuery.length < 2 || !hasSupabaseClientEnv()) return [];

  try {
    const rows = await loadGeoSearchRows(options.includeUserMarks !== false);
    return buildGeoSearchResults(rows, normalizedQuery, options.limit ?? 12);
  } catch (error) {
    if (__DEV__) {
      console.warn("[geo/search] searchGeoEntities failed", error);
    }
    return [];
  }
}

async function loadGeoSearchRows(includeUserMarks: boolean): Promise<GeoSearchRows> {
  const client = getSupabaseClient();

  const { data: countries, error: countriesError } = await client
    .from("geo_countries")
    .select("id,iso2,iso3,name_es,name_en,slug,centroid_latitude,centroid_longitude,bbox")
    .eq("is_active", true);
  if (countriesError) throw countriesError;

  const { data: regions, error: regionsError } = await client
    .from("geo_regions")
    .select("id,country_id,region_code,name_es,name_en,slug,region_type,centroid_latitude,centroid_longitude,bbox")
    .eq("is_active", true);
  if (regionsError) throw regionsError;

  const { data: cities, error: citiesError } = await client
    .from("geo_cities")
    .select("id,country_id,region_id,official_name,name_es,name_en,slug,city_type,centroid_latitude,centroid_longitude,bbox")
    .eq("is_active", true);
  if (citiesError) throw citiesError;

  const { data: aliases, error: aliasesError } = await client
    .from("geo_aliases")
    .select("entity_type,entity_id,name,normalized_name,is_primary")
    .eq("is_active", true);
  if (aliasesError) throw aliasesError;

  const marks = includeUserMarks ? await loadUserGeoMarks() : [];

  return {
    countries: (countries ?? []) as GeoCountryRow[],
    regions: (regions ?? []) as GeoRegionRow[],
    cities: (cities ?? []) as GeoCityRow[],
    aliases: (aliases ?? []) as GeoAliasRow[],
    marks,
  };
}

async function loadUserGeoMarks(): Promise<UserGeoMarkRow[]> {
  const client = getSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();
  if (authError || !user) return [];

  const { data, error } = await client
    .from("user_geo_marks")
    .select("entity_type,entity_id,saved,visited")
    .eq("user_id", user.id);
  if (error) return [];
  return (data ?? []) as UserGeoMarkRow[];
}
