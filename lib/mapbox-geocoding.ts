/**
 * Mapbox Reverse Geocoding: resuelve lat/lng a dirección humana una sola vez.
 * Usar al crear un spot; no llamar al abrir Spot Detail.
 * Token: EXPO_PUBLIC_MAPBOX_TOKEN.
 */

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '';
const REVERSE_URL = 'https://api.mapbox.com/search/geocode/v6/reverse';

type ReverseFeature = {
  type: string;
  properties?: {
    name?: string;
    place_formatted?: string;
    full_address?: string;
    feature_type?: string;
  };
};

type ReverseResponse = {
  type: string;
  features?: ReverseFeature[];
};

/**
 * Formato objetivo: Calle + número, CP Ciudad, Estado, País
 * (o equivalente según datos disponibles).
 * Si no hay resultado razonable, devuelve null.
 */
export async function resolveAddress(
  latitude: number,
  longitude: number
): Promise<string | null> {
  if (!MAPBOX_TOKEN) return null;
  const params = new URLSearchParams({
    longitude: String(longitude),
    latitude: String(latitude),
    access_token: MAPBOX_TOKEN,
  });
  try {
    const res = await fetch(`${REVERSE_URL}?${params.toString()}`);
    if (!res.ok) return null;
    const data = (await res.json()) as ReverseResponse;
    const feature = data?.features?.[0];
    if (!feature?.properties) return null;
    const { name, place_formatted, full_address } = feature.properties;
    if (full_address && full_address.trim()) return full_address.trim();
    const parts: string[] = [];
    if (name?.trim()) parts.push(name.trim());
    if (place_formatted?.trim()) parts.push(place_formatted.trim());
    if (parts.length === 0) return null;
    return parts.join(', ');
  } catch {
    return null;
  }
}

/** Alias para Scope A (Create Spot). Misma lógica: una llamada, string humano o null. */
export const reverseGeocode = resolveAddress;

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

/**
 * Resuelve un texto de búsqueda a un lugar (nombre canónico + coords) solo cuando hay alta certeza.
 * Condiciones: una sola llamada, limit=1. Si no hay exactamente un resultado con nombre y coords, devuelve null.
 * No retries, no cache. Usar solo cuando searchResults.length === 0 y query no vacío.
 */
export async function resolvePlace(query: string): Promise<ResolvedPlace | null> {
  const q = query.trim();
  if (!q || !MAPBOX_TOKEN) return null;
  const params = new URLSearchParams({
    q,
    limit: '1',
    access_token: MAPBOX_TOKEN,
  });
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
