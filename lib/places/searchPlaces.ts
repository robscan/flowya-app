/**
 * Búsqueda de lugares/POIs para Create Spot (mode="places").
 * Mapbox Geocoding API v6 forward, múltiples resultados.
 */

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '';
const FORWARD_URL = 'https://api.mapbox.com/search/geocode/v6/forward';

export type PlaceResult = {
  id: string;
  name: string;
  fullName?: string;
  lat: number;
  lng: number;
  source: 'mapbox';
};

type ForwardFeature = {
  type: string;
  id?: string;
  geometry?: { type: string; coordinates?: [number, number] };
  properties?: {
    name?: string;
    place_formatted?: string;
    full_address?: string;
  };
};

type ForwardResponse = {
  type: string;
  features?: ForwardFeature[];
};

export type SearchPlacesOptions = {
  limit?: number;
  bbox?: { west: number; south: number; east: number; north: number };
  proximity?: { lat: number; lng: number };
};

const DEFAULT_LIMIT = 12;

/**
 * Busca lugares/POIs por texto. Usar en Create Spot (mode="places").
 */
export async function searchPlaces(
  query: string,
  opts?: SearchPlacesOptions
): Promise<PlaceResult[]> {
  const q = query.trim();
  if (!q || !MAPBOX_TOKEN) return [];

  const limit = Math.min(opts?.limit ?? DEFAULT_LIMIT, 15);
  const params = new URLSearchParams({
    q,
    limit: String(limit),
    access_token: MAPBOX_TOKEN,
  });

  if (opts?.proximity) {
    params.set('proximity', `${opts.proximity.lng},${opts.proximity.lat}`);
  }
  if (opts?.bbox) {
    const { west, south, east, north } = opts.bbox;
    params.set('bbox', `${west},${south},${east},${north}`);
  }

  try {
    const res = await fetch(`${FORWARD_URL}?${params.toString()}`);
    if (!res.ok) return [];
    const data = (await res.json()) as ForwardResponse;
    const features = data?.features ?? [];
    const out: PlaceResult[] = [];
    for (let i = 0; i < features.length; i++) {
      const f = features[i];
      if (!f?.geometry?.coordinates?.length) continue;
      const [lng, lat] = f.geometry.coordinates;
      if (typeof lng !== 'number' || typeof lat !== 'number' || !Number.isFinite(lng) || !Number.isFinite(lat))
        continue;
      const name =
        f.properties?.name?.trim() ||
        f.properties?.place_formatted?.trim() ||
        q;
      const fullName = f.properties?.full_address?.trim();
      out.push({
        id: f.id ?? `place-${i}-${lng}-${lat}`,
        name,
        fullName: fullName || undefined,
        lat,
        lng,
        source: 'mapbox',
      });
    }
    return out;
  } catch {
    return [];
  }
}
