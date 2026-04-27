import { normalizeSpotTitle } from '@/lib/spot-duplicate-text';
import { sanitizeCameraBBoxForPoint, type CameraBBox } from '@/lib/places/cameraBBox';
import { searchPlaces, type PlaceResult } from '@/lib/places/searchPlaces';

export type ResolvedCameraFraming = {
  bbox: CameraBBox | null;
  featureType: string | null;
  maki: string | null;
  source: 'selected_place' | 'search' | 'none';
};

type ResolveCameraFramingOptions = {
  name: string;
  lat: number;
  lng: number;
  selectedPlace?: PlaceResult | null;
  limit?: number;
};

function isCloseNameMatch(query: string, result: PlaceResult): boolean {
  const q = normalizeSpotTitle(query);
  if (!q) return false;
  const name = normalizeSpotTitle(result.name ?? '');
  const fullName = normalizeSpotTitle(result.fullName ?? '');
  return name === q || fullName === q || name.includes(q) || fullName.includes(q) || q.includes(name);
}

export async function resolveCameraFramingForPointName({
  name,
  lat,
  lng,
  selectedPlace,
  limit = 5,
}: ResolveCameraFramingOptions): Promise<ResolvedCameraFraming> {
  const point = { lat, lng };
  const selectedBbox = sanitizeCameraBBoxForPoint(selectedPlace?.bbox, point);
  if (selectedBbox) {
    return {
      bbox: selectedBbox,
      featureType: selectedPlace?.featureType ?? null,
      maki: selectedPlace?.maki ?? null,
      source: 'selected_place',
    };
  }

  const trimmedName = name.trim();
  if (!trimmedName) {
    return {
      bbox: null,
      featureType: selectedPlace?.featureType ?? null,
      maki: selectedPlace?.maki ?? null,
      source: 'none',
    };
  }

  try {
    const results = await searchPlaces(trimmedName, {
      proximity: point,
      limit,
    });
    const safeCandidates = results
      .map((place) => ({
        place,
        bbox: sanitizeCameraBBoxForPoint(place.bbox, point),
      }))
      .filter((candidate): candidate is { place: PlaceResult; bbox: CameraBBox } => !!candidate.bbox);
    const preferred =
      safeCandidates.find((candidate) => isCloseNameMatch(trimmedName, candidate.place)) ??
      safeCandidates[0];
    if (preferred) {
      return {
        bbox: preferred.bbox,
        featureType: preferred.place.featureType ?? selectedPlace?.featureType ?? null,
        maki: preferred.place.maki ?? selectedPlace?.maki ?? null,
        source: 'search',
      };
    }
  } catch {
    // Fail-open: cámara debe poder caer al punto aunque Mapbox no resuelva bbox.
  }

  return {
    bbox: null,
    featureType: selectedPlace?.featureType ?? null,
    maki: selectedPlace?.maki ?? null,
    source: 'none',
  };
}
