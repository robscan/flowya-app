/**
 * Mapbox Reverse Geocoding: resuelve lat/lng a dirección humana una sola vez.
 * Usar al crear un spot; no llamar al abrir Spot Detail.
 * Token: EXPO_PUBLIC_MAPBOX_TOKEN.
 * OL-EXPLORE-LOCALE-CONSISTENCY-001: usa language de locale-config.
 */

import { getCurrentLanguage } from '@/lib/i18n/locale-config';

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '';
const REVERSE_URL = 'https://api.mapbox.com/search/geocode/v6/reverse';

type ReverseContextItem = {
  name?: string;
  translations?: Record<string, { language: string; name: string }>;
};

type ReverseContext = {
  country?: ReverseContextItem;
  region?: ReverseContextItem;
  place?: ReverseContextItem;
  district?: ReverseContextItem;
  locality?: ReverseContextItem;
  neighborhood?: ReverseContextItem;
};

type ReverseFeature = {
  type: string;
  properties?: {
    name?: string;
    place_formatted?: string;
    full_address?: string;
    feature_type?: string;
    context?: ReverseContext;
  };
};

type ReverseResponse = {
  type: string;
  features?: ReverseFeature[];
};

function pickContextName(item: ReverseContextItem | undefined, lang: string | null): string | null {
  if (!item) return null;
  const t = item.translations;
  const byLang = lang && t?.[lang]?.name?.trim() ? t[lang].name!.trim() : null;
  const byEn = t?.en?.name?.trim() ?? null;
  const byName = item.name?.trim() ?? null;
  return byLang || byEn || byName || null;
}

/** Devuelve true si el texto parece estar en script latino (es/en). */
function isLatinScript(s: string): boolean {
  return /^[\u0000-\u007F\u00C0-\u024F\s,.\-()]+$/u.test(s.trim());
}

/**
 * Formato objetivo: Calle + número, CP Ciudad, Estado, País
 * (o equivalente según datos disponibles).
 * OL-EXPLORE-LOCALE: Mapbox v6 reverse no devuelve context.translations; para regiones CJK
 * hacemos primero una llamada con types=place,region,country (mejor cobertura idioma).
 */
export async function resolveAddress(
  latitude: number,
  longitude: number
): Promise<string | null> {
  if (!MAPBOX_TOKEN) return null;
  const lang = getCurrentLanguage();
  const langParam = lang === 'en' ? 'en' : lang ? `${lang},en` : 'en';
  const langEnOnly = 'en';

  const fetchReverse = (types?: string, useEnForLatin = false) => {
    const params = new URLSearchParams({
      longitude: String(longitude),
      latitude: String(latitude),
      access_token: MAPBOX_TOKEN,
      language: useEnForLatin ? langEnOnly : langParam,
    });
    if (types) params.set('types', types);
    return fetch(`${REVERSE_URL}?${params.toString()}`);
  };

  try {
    const res = await fetchReverse('place,region,country', true);
    if (!res.ok) return null;
    const data = (await res.json()) as ReverseResponse;
    const features = data?.features ?? [];

    const pickLocalized = (f: ReverseFeature): string | null => {
      const p = f?.properties;
      if (!p) return null;
      const placeFormatted = p.place_formatted?.trim();
      const name = p.name?.trim();
      if (placeFormatted && isLatinScript(placeFormatted)) return placeFormatted;
      if (name && isLatinScript(name)) return name;
      return placeFormatted || name || null;
    };

    for (const f of features) {
      const addr = pickLocalized(f);
      if (addr) return addr;
    }

    const res2 = await fetchReverse();
    if (!res2.ok) return null;
    const data2 = (await res2.json()) as ReverseResponse;
    const feature = data2?.features?.[0];
    if (!feature?.properties) return null;
    const { place_formatted, full_address, name } = feature.properties;

    const fallback = full_address?.trim() || place_formatted?.trim() || name?.trim();
    return fallback || null;
  } catch {
    return null;
  }
}

/** Alias para Scope A (Create Spot). Misma lógica: una llamada, string humano o null. */
export const reverseGeocode = resolveAddress;

/**
 * Devuelve el nombre del lugar en el idioma solicitado (es,en).
 * Usa types=country,region,place para evitar address (suele venir en script local).
 * Fallback cuando tiles/búsqueda devuelven nombre en script local (CJK, cirílico).
 */
export async function resolvePlaceNameAtCoords(
  latitude: number,
  longitude: number
): Promise<string | null> {
  if (!MAPBOX_TOKEN) return null;
  const params = new URLSearchParams({
    longitude: String(longitude),
    latitude: String(latitude),
    access_token: MAPBOX_TOKEN,
    types: 'country,region,place',
  });
  const lang = getCurrentLanguage();
  if (lang) params.set('language', lang === 'en' ? 'en' : `${lang},en`);
  try {
    const res = await fetch(`${REVERSE_URL}?${params.toString()}`);
    if (!res.ok) return null;
    const data = (await res.json()) as ReverseResponse;
    const feature = data?.features?.[0];
    const context = feature?.properties?.context;

    const pickName = (item?: ReverseContextItem): string | null => {
      if (!item) return null;
      const t = item.translations;
      const byLang = (lang && t?.[lang]?.name?.trim()) ?? null;
      const byEn = t?.en?.name?.trim() ?? null;
      const byName = item.name?.trim() ?? null;
      return byLang || byEn || byName || null;
    };

    const levels: (keyof ReverseContext)[] = ['place', 'region', 'country'];
    for (const level of levels) {
      const name = pickName(context?.[level]);
      if (name) return name;
    }

    const name = feature?.properties?.name?.trim();
    return name || null;
  } catch {
    return null;
  }
}

/** B2-MS4: Forward geocoding (query → lugar). Solo en Search; sin retries ni persistencia. */
const FORWARD_URL = 'https://api.mapbox.com/search/geocode/v6/forward';

type ForwardFeature = {
  type: string;
  geometry?: { type: string; coordinates?: [number, number] };
  properties?: { name?: string; place_formatted?: string; feature_type?: string };
};

type ForwardResponse = {
  type: string;
  features?: ForwardFeature[];
};

export type ResolvedPlace = {
  name: string;
  latitude: number;
  longitude: number;
};

export type ResolvePlaceForCreateOptions = {
  proximity?: { lat: number; lng: number };
  bbox?: { west: number; south: number; east: number; north: number };
};

/**
 * Forward geocoding para el CTA "Crear" en Map Search (mode=spots).
 * Solo para obtener coords antes de navegar a Create Spot; no es el motor de búsqueda de spots.
 * limit=1; opcional proximity/bbox para priorizar cerca del viewport/usuario.
 */
export async function resolvePlaceForCreate(
  query: string,
  opts?: ResolvePlaceForCreateOptions
): Promise<ResolvedPlace | null> {
  const q = query.trim();
  if (!q || !MAPBOX_TOKEN) return null;
  const params = new URLSearchParams({
    q,
    limit: '1',
    access_token: MAPBOX_TOKEN,
  });
  const lang = getCurrentLanguage();
  if (lang) params.set('language', lang === 'en' ? 'en' : `${lang},en`);
  if (opts?.proximity) {
    params.set('proximity', `${opts.proximity.lng},${opts.proximity.lat}`);
  }
  if (opts?.bbox) {
    const { west, south, east, north } = opts.bbox;
    params.set('bbox', `${west},${south},${east},${north}`);
  }
  try {
    const res = await fetch(`${FORWARD_URL}?${params.toString()}`);
    if (!res.ok) return null;
    const data = (await res.json()) as ForwardResponse;
    const feature = data?.features?.[0];
    if (!feature?.geometry?.coordinates?.length || !feature?.properties) return null;
    const [lng, lat] = feature.geometry.coordinates;
    if (typeof lng !== 'number' || typeof lat !== 'number' || !Number.isFinite(lng) || !Number.isFinite(lat))
      return null;
    const name =
      feature.properties.name?.trim() ||
      feature.properties.place_formatted?.trim() ||
      q;
    return { name, latitude: lat, longitude: lng };
  } catch {
    return null;
  }
}
