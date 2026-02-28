/**
 * OL-WOW-F2-001-EMPTY: búsqueda de POIs por categoría Mapbox Search Box Category API.
 * Usado en isEmpty para fusionar spots Flowya + POIs cercanos (attraction/landmark).
 */

import type { PlaceResult } from './searchPlaces';

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '';
const CATEGORY_URL = 'https://api.mapbox.com/search/searchbox/v1/category';

export type SearchPlacesCategoryOptions = {
  limit?: number;
  proximity?: { lat: number; lng: number };
  bbox?: { west: number; south: number; east: number; north: number };
};

type CategoryFeature = {
  type?: string;
  geometry?: { coordinates?: [number, number] };
  properties?: {
    mapbox_id?: string;
    name?: string;
    name_preferred?: string;
    full_address?: string;
    place_formatted?: string;
    feature_type?: string;
    maki?: string;
    poi_category?: string[] | string;
    poi_category_ids?: string[];
    coordinates?: { latitude?: number; longitude?: number };
  };
};

type CategoryResponse = {
  type?: string;
  features?: CategoryFeature[];
};

const DEFAULT_LIMIT = 6;
const MAX_LIMIT = 25;

/**
 * Busca POIs por categoría canónica Mapbox (ej. attraction, landmark, coffee).
 * Usado en isEmpty para mostrar lugares cercanos junto a spots Flowya.
 */
export async function searchPlacesByCategory(
  category: string,
  opts?: SearchPlacesCategoryOptions
): Promise<PlaceResult[]> {
  const cat = category.trim().toLowerCase();
  if (!cat || !MAPBOX_TOKEN) return [];

  const limit = Math.min(opts?.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
  const params = new URLSearchParams({
    access_token: MAPBOX_TOKEN,
    limit: String(limit),
  });

  if (opts?.proximity) {
    params.set('proximity', `${opts.proximity.lng},${opts.proximity.lat}`);
  }
  if (opts?.bbox) {
    const { west, south, east, north } = opts.bbox;
    params.set('bbox', `${west},${south},${east},${north}`);
  }

  try {
    const res = await fetch(`${CATEGORY_URL}/${encodeURIComponent(cat)}?${params.toString()}`);
    if (!res.ok) return [];
    const data = (await res.json()) as CategoryResponse;
    const features = data?.features ?? [];
    const out: PlaceResult[] = [];
    for (let i = 0; i < features.length; i++) {
      const f = features[i];
      let lat: number;
      let lng: number;
      if (f?.geometry?.coordinates?.length === 2) {
        [lng, lat] = f.geometry.coordinates;
      } else if (
        f?.properties?.coordinates?.latitude != null &&
        f?.properties?.coordinates?.longitude != null
      ) {
        lat = f.properties.coordinates.latitude;
        lng = f.properties.coordinates.longitude;
      } else {
        continue;
      }
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      const name =
        f.properties?.name?.trim() ||
        f.properties?.name_preferred?.trim() ||
        f.properties?.place_formatted?.trim() ||
        `Lugar ${i + 1}`;
      const fullName =
        f.properties?.full_address?.trim() ||
        f.properties?.place_formatted?.trim() ||
        undefined;
      const cats = f.properties?.poi_category_ids ?? f.properties?.poi_category;
      out.push({
        id: f.properties?.mapbox_id ?? `place-${i}-${lng}-${lat}`,
        name,
        fullName: fullName || undefined,
        lat,
        lng,
        source: 'mapbox',
        maki: f.properties?.maki?.trim() || undefined,
        featureType: f.properties?.feature_type?.trim() || undefined,
        categories: Array.isArray(cats)
          ? cats.filter((c): c is string => typeof c === 'string' && c.trim().length > 0)
          : typeof cats === 'string' && cats.trim().length > 0
            ? [cats.trim()]
            : undefined,
      });
    }
    return out;
  } catch {
    return [];
  }
}
