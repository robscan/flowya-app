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
import {
  bboxMaxSpanDegrees,
  sanitizeCameraBBoxForPoint,
  type CameraBBox,
} from '@/lib/places/cameraBBox';

export {
  bboxMaxSpanDegrees,
  doesCameraBBoxContainPoint,
  isFiniteCameraBBox,
  isFiniteCameraPoint,
  sanitizeCameraBBoxForPoint,
  type CameraBBox,
  type CameraPoint,
} from '@/lib/places/cameraBBox';

/** Segundo paso del ciclo de encuadre: vista general (mismo centro); más bajo = más zoom out. */
export const SPOT_REFRAME_CYCLE_WIDE_ZOOM = 10;

/** Metadatos guardados en spots creados desde Mapbox Search para reutilizar encuadre. */
export type SpotCameraFraming = {
  bbox?: CameraBBox;
  featureType?: string | null;
  maki?: string | null;
} | null;

const LANDMARK_TOKENS = ['landmark', 'monument', 'museum', 'religious', 'historic'];
const AREA_POI_TOKENS = [
  'park',
  'garden',
  'attraction',
  'tourism',
  'recreation',
  'reserve',
  'beach',
  'zoo',
  'aquarium',
  'stadium',
  'university',
  'campus',
  'airport',
];

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

function placeTokensForCamera(place: PlaceResult): string[] {
  return [
    (place.maki ?? '').toLowerCase(),
    featureTypeLower(place),
    ...((place.categories ?? []).map((c) => String(c).toLowerCase())),
  ].filter(Boolean);
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

export function isAreaPoiPlace(place: PlaceResult): boolean {
  const tokens = placeTokensForCamera(place);
  return tokens.some((token) => AREA_POI_TOKENS.some((areaToken) => token.includes(areaToken)));
}

const MIN_SPAN_FOR_BBOX_FRAMING = 0.012;

/**
 * ¿Usar fitBounds con el bbox del lugar?
 * - País/región/ciudad: sí si hay bbox razonable.
 * - Landmark puntual (maki historic, etc.) con bbox muy pequeño: no (zoom al pin).
 * - Landmark con bbox amplio (yacimiento, parque arqueológico, ej. Copán Ruinas): sí.
 */
export function shouldFitBoundsForPlace(place: PlaceResult): boolean {
  const bbox = sanitizeCameraBBoxForPoint(place.bbox, { lat: place.lat, lng: place.lng });
  if (!bbox) return false;
  const span = bboxMaxSpanDegrees(bbox);
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
  if (isAreaPoiPlace(place)) return 13.6;
  return SPOT_FOCUS_ZOOM;
}

export function shouldUseWideAreaCamera(place: PlaceResult): boolean {
  return (
    !isPlaceLandmarkForCamera(place) &&
    (isCountryOrRegionFeature(place) || isSemanticAreaPlace(place) || isAreaPoiPlace(place))
  );
}

/**
 * Construye un PlaceResult mínimo para heurísticas de cámara a partir de un spot guardado.
 */
export function placeResultFromSpotForCamera(
  selectedSpot: { id: string; latitude: number; longitude: number },
  framing: SpotCameraFraming,
): PlaceResult {
  const bbox = sanitizeCameraBBoxForPoint(framing?.bbox, {
    lat: selectedSpot.latitude,
    lng: selectedSpot.longitude,
  });
  return {
    id: selectedSpot.id,
    name: '',
    lat: selectedSpot.latitude,
    lng: selectedSpot.longitude,
    source: 'mapbox',
    bbox,
    maki: framing?.maki ?? undefined,
    featureType: framing?.featureType ?? undefined,
  };
}

/**
 * Encuadre unificado: fitBounds cuando el bbox aplica; si no, flyTo con zoom de área o SPOT_FOCUS_ZOOM.
 */
type FitBoundsPadding =
  | number
  | { top: number; right: number; bottom: number; left: number };

export function applyExploreCameraForPlace(
  map: MapboxMap | null,
  place: PlaceResult,
  flyTo: (center: { lng: number; lat: number }, options?: { zoom?: number; duration?: number }) => void,
  options?: { duration?: number; fitBoundsPadding?: FitBoundsPadding },
): void {
  const duration = options?.duration ?? FIT_BOUNDS_DURATION_MS;
  const fitPadding = options?.fitBoundsPadding ?? FIT_BOUNDS_PADDING;
  const safeBbox = sanitizeCameraBBoxForPoint(place.bbox, { lat: place.lat, lng: place.lng });
  const cameraPlace = safeBbox === place.bbox ? place : { ...place, bbox: safeBbox };
  if (map && safeBbox && shouldFitBoundsForPlace(cameraPlace)) {
    const { west, south, east, north } = safeBbox;
    try {
      map.fitBounds(
        [
          [west, south],
          [east, north],
        ],
        { padding: fitPadding, duration },
      );
      return;
    } catch {
      // fallback a flyTo
    }
  }
  const useWideAreaZoom = shouldUseWideAreaCamera(cameraPlace);
  flyTo(
    { lng: cameraPlace.lng, lat: cameraPlace.lat },
    {
      zoom: useWideAreaZoom ? getAreaFallbackZoom(cameraPlace) : SPOT_FOCUS_ZOOM,
      duration,
    },
  );
}

/**
 * Ciclo de encuadre sobre el mismo ancla (sin ubicación del usuario).
 * Paso par (0,2,…): encuadre contextual — `fitBounds` cuando hay bbox y aplica, si no `flyTo` con zoom de área o detalle (`applyExploreCameraForPlace`).
 * Paso impar (1,3,…): zoom general (mismo centro, `SPOT_REFRAME_CYCLE_WIDE_ZOOM`).
 */
export function applyPlaceReframeCycle(
  map: MapboxMap | null,
  place: PlaceResult,
  stepMod2: number,
  flyTo: (center: { lng: number; lat: number }, options?: { zoom?: number; duration?: number }) => void,
  options?: { duration?: number },
): void {
  const duration = options?.duration ?? FIT_BOUNDS_DURATION_MS;
  const step = ((stepMod2 % 2) + 2) % 2;
  if (step === 0) {
    applyExploreCameraForPlace(map, place, flyTo, { duration });
    return;
  }
  flyTo(
    { lng: place.lng, lat: place.lat },
    { zoom: SPOT_REFRAME_CYCLE_WIDE_ZOOM, duration },
  );
}
