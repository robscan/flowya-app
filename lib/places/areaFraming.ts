/**
 * Heurísticas de encuadre (fitBounds vs zoom puntual) para lugares de Mapbox Search.
 * Evita acercar demasiado ciudades/regiones con bbox; preserva POI puntuales y landmarks.
 */

import type { Map as MapboxMap } from 'mapbox-gl';

import type { PlaceResult } from '@/lib/places/searchPlaces';
import {
  FIT_BOUNDS_DURATION_MS,
  FIT_BOUNDS_PADDING,
  SPOT_FOCUS_ZOOM,
} from '@/lib/map-core/constants';

/** Metadatos guardados en spots creados desde Mapbox Search para reutilizar encuadre. */
export type SpotCameraFraming = {
  bbox?: { west: number; south: number; east: number; north: number };
  featureType?: string | null;
  maki?: string | null;
} | null;

const LANDMARK_TOKENS = ['landmark', 'monument', 'museum', 'religious', 'historic'];

/** Span geográfico máximo (grados) en el bbox. */
export function bboxMaxSpanDegrees(bbox: {
  west: number;
  south: number;
  east: number;
  north: number;
}): number {
  return Math.max(Math.abs(bbox.east - bbox.west), Math.abs(bbox.north - bbox.south));
}

function isPlaceLandmarkForCamera(place: PlaceResult): boolean {
  const maki = (place.maki ?? '').toLowerCase();
  const ft = (place.featureType ?? '').toLowerCase();
  const cats = (place.categories ?? []).map((c) => String(c).toLowerCase());
  if (ft.includes('landmark')) return true;
  if (LANDMARK_TOKENS.some((t) => maki.includes(t))) return true;
  if (cats.some((c) => LANDMARK_TOKENS.some((t) => c.includes(t)))) return true;
  return false;
}

function featureTypeLower(place: PlaceResult): string {
  return (place.featureType ?? '').toLowerCase();
}

/** País o región administrativa amplia. */
export function isCountryOrRegionFeature(place: PlaceResult): boolean {
  const ft = featureTypeLower(place);
  return ft.includes('country') || ft.includes('region');
}

/** Entidades de “área” (ciudad, colonia, distrito, parque administrativo, etc.). */
export function isSemanticAreaPlace(place: PlaceResult): boolean {
  const ft = featureTypeLower(place);
  const areaTokens = [
    'place',
    'district',
    'locality',
    'neighborhood',
    'neighbourhood',
    'postcode',
    'municipality',
  ];
  return areaTokens.some((t) => ft.includes(t));
}

const MIN_SPAN_FOR_BBOX_FRAMING = 0.012;

/**
 * ¿Usar fitBounds con el bbox del lugar?
 * - País/región/ciudad: sí si hay bbox razonable.
 * - Landmark puntual (maki historic, etc.) con bbox muy pequeño: no (zoom al pin).
 * - Landmark con bbox amplio (yacimiento, parque arqueológico, ej. Copán Ruinas): sí.
 */
export function shouldFitBoundsForPlace(place: PlaceResult): boolean {
  if (!place.bbox) return false;
  const span = bboxMaxSpanDegrees(place.bbox);
  if (isPlaceLandmarkForCamera(place)) {
    return span >= MIN_SPAN_FOR_BBOX_FRAMING;
  }
  if (isCountryOrRegionFeature(place) || isSemanticAreaPlace(place)) return true;
  if (span >= MIN_SPAN_FOR_BBOX_FRAMING) return true;
  return false;
}

/**
 * Zoom de respaldo cuando no hay bbox o falla fitBounds, pero el lugar es “área”.
 */
export function getAreaFallbackZoom(place: PlaceResult): number {
  if (isPlaceLandmarkForCamera(place)) return SPOT_FOCUS_ZOOM;
  const ft = featureTypeLower(place);
  if (ft.includes('country')) return 3.6;
  if (ft.includes('region')) return 5.5;
  if (isSemanticAreaPlace(place) || isCountryOrRegionFeature(place)) return 6.5;
  return SPOT_FOCUS_ZOOM;
}

export function shouldUseWideAreaCamera(place: PlaceResult): boolean {
  return (
    !isPlaceLandmarkForCamera(place) &&
    (isCountryOrRegionFeature(place) || isSemanticAreaPlace(place))
  );
}

/**
 * Construye un PlaceResult mínimo para heurísticas de cámara a partir de un spot guardado.
 */
export function placeResultFromSpotForCamera(
  selectedSpot: { id: string; latitude: number; longitude: number },
  framing: SpotCameraFraming,
): PlaceResult {
  return {
    id: selectedSpot.id,
    name: '',
    lat: selectedSpot.latitude,
    lng: selectedSpot.longitude,
    source: 'mapbox',
    bbox: framing?.bbox,
    maki: framing?.maki ?? undefined,
    featureType: framing?.featureType ?? undefined,
  };
}

/**
 * Encuadre unificado: fitBounds cuando el bbox aplica; si no, flyTo con zoom de área o SPOT_FOCUS_ZOOM.
 */
export function applyExploreCameraForPlace(
  map: MapboxMap | null,
  place: PlaceResult,
  flyTo: (center: { lng: number; lat: number }, options?: { zoom?: number; duration?: number }) => void,
  options?: { duration?: number },
): void {
  const duration = options?.duration ?? FIT_BOUNDS_DURATION_MS;
  if (map && shouldFitBoundsForPlace(place) && place.bbox) {
    const { west, south, east, north } = place.bbox;
    try {
      map.fitBounds(
        [
          [west, south],
          [east, north],
        ],
        { padding: FIT_BOUNDS_PADDING, duration },
      );
      return;
    } catch {
      // fallback a flyTo
    }
  }
  const useWideAreaZoom = shouldUseWideAreaCamera(place);
  flyTo(
    { lng: place.lng, lat: place.lat },
    {
      zoom: useWideAreaZoom ? getAreaFallbackZoom(place) : SPOT_FOCUS_ZOOM,
      duration,
    },
  );
}
