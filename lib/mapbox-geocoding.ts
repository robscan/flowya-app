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
