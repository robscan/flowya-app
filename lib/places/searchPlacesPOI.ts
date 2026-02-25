/**
 * Adapter externo POI-first (Track B / Search V2).
 * Estrategia simplificada: Search Box /forward (single request) + fallback Geocoding.
 */

import { searchPlaces, type PlaceResult, type SearchPlacesOptions } from './searchPlaces';

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '';
const SEARCHBOX_FORWARD_URL = 'https://api.mapbox.com/search/searchbox/v1/forward';

let searchBoxCooldownUntil = 0;

export type PlaceResultV2 = {
  id: string;
  name: string;
  fullName?: string;
  lat: number;
  lng: number;
  source: 'mapbox_geocoding' | 'mapbox_searchbox';
  maki?: string;
  featureType?: string;
  categories?: string[];
};

export type SearchPlacesPOIOptions = SearchPlacesOptions & {
  preferSearchBox?: boolean;
};

type SearchBoxFeature = {
  id?: string;
  geometry?: { coordinates?: [number, number] };
  properties?: {
    mapbox_id?: string;
    name?: string;
    name_preferred?: string;
    full_address?: string;
    place_formatted?: string;
    feature_type?: string;
    maki?: string;
    poi_category_ids?: string[];
    poi_category?: string[];
  };
};

type SearchBoxForwardResponse = {
  features?: SearchBoxFeature[];
};

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function dedupePlaces(items: PlaceResult[]): PlaceResult[] {
  const seen = new Set<string>();
  const out: PlaceResult[] = [];
  for (const item of items) {
    const key = `${item.id}:${item.name.trim().toLowerCase()}:${item.lat.toFixed(5)}:${item.lng.toFixed(5)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

const LANDMARK_HINTS = [
  'torre',
  'tower',
  'eiffel',
  'monumento',
  'monument',
  'museo',
  'museum',
  'catedral',
  'cathedral',
  'castillo',
  'castle',
  'palacio',
  'palace',
  'puente',
  'bridge',
  'basilica',
  'statue',
  'estatua',
  'templo',
  'temple',
];

const NON_GEO_HINTS = [
  'hotel',
  'restaurante',
  'restaurant',
  'bar',
  'cafe',
  'cafeteria',
  'tour',
  'tours',
  'ferry',
  'taxi',
  'rent',
  'rental',
  'shop',
  'store',
  'mall',
];

function isLandmarkIntentQuery(query: string): boolean {
  const q = normalize(query).replace(/\beifel\b/g, 'eiffel');
  return LANDMARK_HINTS.some((hint) => q.includes(hint));
}

function isGeoIntentQuery(query: string): boolean {
  const q = normalize(query);
  if (!q || isLandmarkIntentQuery(query)) return false;
  if (q.includes(',')) return true;
  const words = q.split(/\s+/).filter(Boolean);
  return words.length <= 2 && !NON_GEO_HINTS.some((hint) => q.includes(hint));
}

function toLegacyPlace(item: PlaceResultV2): PlaceResult {
  return {
    id: item.id,
    name: item.name,
    fullName: item.fullName,
    lat: item.lat,
    lng: item.lng,
    source: 'mapbox',
    maki: item.maki,
    featureType: item.featureType,
    categories: item.categories,
  };
}

function mapLegacyToV2(item: PlaceResult): PlaceResultV2 {
  return {
    id: item.id,
    name: item.name,
    fullName: item.fullName,
    lat: item.lat,
    lng: item.lng,
    source: 'mapbox_geocoding',
    maki: item.maki,
    featureType: item.featureType,
    categories: item.categories,
  };
}

export function placeResultV2ToLegacy(item: PlaceResultV2): PlaceResult {
  return toLegacyPlace(item);
}

function parseSearchBoxForward(data: SearchBoxForwardResponse, fallbackQuery: string): PlaceResultV2[] {
  const out: PlaceResultV2[] = [];
  const features = data.features ?? [];
  for (let i = 0; i < features.length; i++) {
    const f = features[i];
    const coords = f.geometry?.coordinates;
    const [lng, lat] = Array.isArray(coords) ? coords : [NaN, NaN];
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const p = f.properties;
    const name = p?.name?.trim() || p?.name_preferred?.trim() || fallbackQuery;
    const fullName = p?.full_address?.trim() || p?.place_formatted?.trim() || undefined;
    out.push({
      id: p?.mapbox_id?.trim() || f.id?.trim() || `sb-${i}-${lng}-${lat}`,
      name,
      fullName,
      lat,
      lng,
      source: 'mapbox_searchbox',
      maki: p?.maki?.trim() || undefined,
      featureType: p?.feature_type?.trim() || undefined,
      categories: p?.poi_category_ids ?? p?.poi_category,
    });
  }
  return out;
}

async function searchBoxForward(
  query: string,
  opts: SearchPlacesOptions,
  intent: 'landmark' | 'geo' | 'recommendation'
): Promise<PlaceResultV2[]> {
  if (!MAPBOX_TOKEN) return [];
  if (Date.now() < searchBoxCooldownUntil) return [];

  const params = new URLSearchParams({
    q: query,
    access_token: MAPBOX_TOKEN,
    limit: String(Math.max(1, Math.min(opts.limit ?? 6, 12))),
    language: 'es,en',
    auto_complete: 'true',
  });

  if (intent === 'landmark') {
    params.set('types', 'poi,place,locality,district,region,country');
  } else if (intent === 'geo') {
    params.set('types', 'country,region,place,city,locality,district,neighborhood');
  } else {
    params.set('types', 'poi,place,locality,address,street');
    if (opts.proximity) params.set('proximity', `${opts.proximity.lng},${opts.proximity.lat}`);
    if (opts.bbox) {
      const { west, south, east, north } = opts.bbox;
      params.set('bbox', `${west},${south},${east},${north}`);
    }
  }

  const res = await fetch(`${SEARCHBOX_FORWARD_URL}?${params.toString()}`);
  if (res.status === 429) {
    searchBoxCooldownUntil = Date.now() + 30_000;
    return [];
  }
  if (!res.ok) return [];
  const json = (await res.json()) as SearchBoxForwardResponse;
  return parseSearchBoxForward(json, query);
}

function rankLandmarkSimple(items: PlaceResultV2[], query: string): PlaceResultV2[] {
  const q = normalize(query).replace(/\beifel\b/g, 'eiffel');
  const tokens = q.split(/\s+/).filter(Boolean);
  const asksParis = tokens.includes('paris');
  return items
    .map((item, idx) => {
      const bag = normalize(`${item.name} ${item.fullName ?? ''}`).replace(/\beifel\b/g, 'eiffel');
      const matchCount = tokens.filter((t) => bag.includes(t)).length;
      const fullCoverage = matchCount === tokens.length;
      const exact = normalize(item.name) === q;
      const streetLike = /\b(calle|street|avenida|av\b|rue|rua|road|rd\b)\b/.test(bag);
      let score = matchCount * 100 - idx;
      if (fullCoverage) score += 120;
      if (exact) score += 140;
      if (asksParis && bag.includes('paris')) score += 120;
      if (asksParis && bag.includes('mexico')) score -= 120;
      if (streetLike) score -= 120;
      return { item, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);
}

export async function searchPlacesPOI(
  query: string,
  opts?: SearchPlacesPOIOptions
): Promise<PlaceResultV2[]> {
  const q = query.trim();
  if (!q) return [];

  const inputLimit = Math.max(1, Math.min(opts?.limit ?? 6, 15));
  const landmarkIntent = isLandmarkIntentQuery(q);
  const geoIntent = isGeoIntentQuery(q);
  const intent: 'landmark' | 'geo' | 'recommendation' = landmarkIntent
    ? 'landmark'
    : geoIntent
      ? 'geo'
      : 'recommendation';

  const baseOpts: SearchPlacesOptions = {
    limit: inputLimit,
    bbox: opts?.bbox,
    proximity: opts?.proximity,
  };

  const sb = await searchBoxForward(q, baseOpts, intent);
  if (sb.length > 0) {
    const ranked = landmarkIntent ? rankLandmarkSimple(sb, q) : sb;
    return dedupePlaces(ranked.map(toLegacyPlace)).slice(0, inputLimit).map(mapLegacyToV2);
  }

  // Fallback estable: Geocoding global para landmark/geo; local para recommendation.
  const geocodingFallback = await searchPlaces(q, {
    limit: inputLimit,
    bbox: intent === 'recommendation' ? opts?.bbox : undefined,
    proximity: intent === 'recommendation' ? opts?.proximity : undefined,
    types:
      intent === 'geo'
        ? ['country', 'region', 'place', 'locality', 'district', 'neighborhood']
        : intent === 'recommendation'
          ? ['place', 'locality', 'district', 'neighborhood', 'address', 'street']
          : undefined,
  });

  return dedupePlaces(geocodingFallback).slice(0, inputLimit).map(mapLegacyToV2);
}
