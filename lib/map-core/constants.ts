/**
 * MapCore — constantes y helpers compartidos para el núcleo del mapa (Explorar).
 * Extraídos desde app/(tabs)/index.web.tsx para reutilización v0/vNext.
 */

import type { Map as MapboxMap } from 'mapbox-gl';

/** Fallback cuando geolocalización está denegada o no disponible (Riviera Maya). */
export const FALLBACK_VIEW = { longitude: -87.2, latitude: 20.4, zoom: 10 };

/** Bounds globales para el control "Ver el mundo" (límites Web Mercator). */
export const WORLD_BOUNDS: [[number, number], [number, number]] = [
  [-180, -85.051129],
  [180, 85.051129],
];

/** Zoom mínimo para mostrar nombres de spots (labels solo cuando hay espacio). */
export const LABEL_MIN_ZOOM = 12;

export const FIT_BOUNDS_PADDING = 64;
export const FIT_BOUNDS_DURATION_MS = 1200;
export const SPOT_FOCUS_ZOOM = 15;

export const LONG_PRESS_MS = 3000;
export const LONG_PRESS_DRAG_THRESHOLD_PX = 10;

/** Capas a ocultar (POIs comerciales, negocios). */
const HIDE_LAYER_IDS = ['poi-label'];

export function hideNoiseLayers(map: MapboxMap): void {
  try {
    const style = map.getStyle();
    if (!style?.layers) return;
    for (const layer of style.layers) {
      if (HIDE_LAYER_IDS.includes(layer.id)) {
        map.setLayoutProperty(layer.id, 'visibility', 'none');
      }
    }
  } catch {
    // ignore if style/layers not ready
  }
}

export function applyGlobeAndAtmosphere(map: MapboxMap): void {
  try {
    map.setProjection('globe');
    map.setFog({
      range: [0.5, 10],
      color: 'rgb(186, 210, 235)',
      'high-color': 'rgb(36, 92, 223)',
      'horizon-blend': 0.02,
      'space-color': 'rgb(11, 11, 25)',
      'star-intensity': 0.35,
    });
  } catch {
    // ignore if style not ready
  }
}

export type UserCoords = { latitude: number; longitude: number } | null;

/** Centra el mapa en la ubicación del usuario al cargar; llama onCoords con las coords. */
export function tryCenterOnUser(
  map: MapboxMap,
  onCoords: (coords: UserCoords) => void
): void {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const coords = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      };
      onCoords(coords);
      map.flyTo({
        center: [coords.longitude, coords.latitude],
        zoom: 14,
        duration: 1500,
      });
    },
    () => {},
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
  );
}
