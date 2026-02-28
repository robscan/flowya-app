/**
 * MapCore — constantes y helpers compartidos para el núcleo del mapa (Explorar).
 * Extraídos desde app/(tabs)/index.web.tsx para reutilización v0/vNext.
 */

import type { Map as MapboxMap } from 'mapbox-gl';

/** Estilos FLOWYA (Mapbox Studio). Light preset day. */
export const FLOWYA_MAP_STYLE_LIGHT =
  "mapbox://styles/robscan/cmlyeznh2000q01s35k8s2pv1";

/** Estilo FLOWYA dark (lightPreset: night). */
export const FLOWYA_MAP_STYLE_DARK =
  "mapbox://styles/robscan/cmlyfk2g1000i01rzcgy0d8cl";

/** Fallback cuando geolocalización está denegada o no disponible (Riviera Maya). */
export const FALLBACK_VIEW = { longitude: -87.2, latitude: 20.4, zoom: 10 };

/** Pitch y bearing iniciales para estilo FLOWYA (navegación 3D). */
export const INITIAL_PITCH = 45;
export const INITIAL_BEARING = 0;

/** Bounds globales para el control "Ver el mundo" (límites Web Mercator). */
export const WORLD_BOUNDS: [[number, number], [number, number]] = [
  [-180, -85.051129],
  [180, 85.051129],
];

/** Zoom mínimo para mostrar nombres de spots (labels solo cuando hay espacio). */
export const LABEL_MIN_ZOOM = 12;

/** Tolerancia en km para considerar que un spot coincide con un POI tocado (~25 m). */
export const SPOT_POI_MATCH_TOLERANCE_KM = 0.025;

/** Radio en km para "Spots en la zona" (independiente del zoom del mapa). */
export const SPOTS_ZONA_RADIUS_KM = 10;

export const FIT_BOUNDS_PADDING = 64;
export const FIT_BOUNDS_DURATION_MS = 1200;
/** Zoom al encuadrar spot (card búsqueda, control encuadrar). 17 = nivel edificio. */
export const SPOT_FOCUS_ZOOM = 17;

/** Padding inferior (px) al flyTo cuando sheet medium/expanded. El spot queda en zona visible. */
export const SPOT_FOCUS_PADDING_BOTTOM = 220;

export const LONG_PRESS_MS = 3000;
export const LONG_PRESS_DRAG_THRESHOLD_PX = 10;

/** Layer IDs o prefijos para filtrar features POI/place en queryRenderedFeatures. */
export const POI_LAYER_PREFIXES = ['poi', 'place', 'symbol'];

/** IDs de capa donde insertar flowya-spots (debajo de POIs). Primera coincidencia. */
const POI_LAYER_IDS_TO_INSERT_BEFORE = [
  'poi-label',
  'place-label',
  'road-label-simple',
  'road-label',
  'natural-line-label',
  'water-line-label',
  'waterway-label',
];

/**
 * Devuelve el layer ID antes del cual insertar flowya-spots para quedar debajo de POIs.
 * Si no encuentra, devuelve undefined (se añade al final).
 */
export function getPoiLayerBeforeId(map: MapboxMap): string | undefined {
  try {
    const layers = map.getStyle().layers ?? [];
    for (const targetId of POI_LAYER_IDS_TO_INSERT_BEFORE) {
      if (layers.some((l) => l.id === targetId)) return targetId;
    }
    const firstSymbol = layers.find((l) => l.type === 'symbol');
    if (firstSymbol) return firstSymbol.id;
  } catch {
    // ignore
  }
  return undefined;
}

/** Estilo de label tipo Mapbox (para flowya-spots). Fallback cuando no se puede extraer del estilo. */
export type MapboxLabelStyle = {
  textSize: number;
  textColor: string;
  textHaloColor: string;
  textHaloWidth: number;
  textFont: string[];
};

/** Estilo de labels para modo light (alineado con Mapbox POI). */
export const MAPBOX_LABEL_STYLE_LIGHT: MapboxLabelStyle = {
  textSize: 12,
  textColor: '#1d1d1f',
  textHaloColor: 'rgba(255,255,255,0.9)',
  textHaloWidth: 2,
  textFont: ['Noto Sans Regular', 'Arial Unicode MS Regular'],
};

/** Estilo de labels para modo dark. */
export const MAPBOX_LABEL_STYLE_DARK: MapboxLabelStyle = {
  textSize: 12,
  textColor: '#f5f5f7',
  textHaloColor: 'rgba(0,0,0,0.8)',
  textHaloWidth: 2.5,
  textFont: ['Noto Sans Regular', 'Arial Unicode MS Regular'],
};

/** Capas a ocultar (POIs comerciales, negocios). */
const HIDE_LAYER_IDS = ['poi-label'];

type HideNoiseLayersOptions = {
  preservePoiLabels?: boolean;
};

export function hideNoiseLayers(map: MapboxMap, options: HideNoiseLayersOptions = {}): void {
  try {
    const style = map.getStyle();
    if (!style?.layers) return;
    const { preservePoiLabels = false } = options;
    for (const layer of style.layers) {
      const shouldHideLayer = HIDE_LAYER_IDS.includes(layer.id);
      if (preservePoiLabels && shouldHideLayer) continue;
      if (shouldHideLayer) {
        map.setLayoutProperty(layer.id, 'visibility', 'none');
      }
    }
  } catch {
    // ignore if style/layers not ready
  }
}

/**
 * Algunos tokens/entornos no tienen acceso al tileset de landmarks del estilo base
 * (`mapbox.mapbox-landmark-pois-v1`) y generan 404 continuos. Removemos esas capas/fuentes
 * cuando aparecen para mantener la consola limpia y evitar requests repetidos.
 */
export function stripUnavailableLandmarkPoiTileset(map: MapboxMap): void {
  try {
    const style = map.getStyle();
    if (!style?.sources) return;
    const blockedSourceIds = Object.entries(style.sources)
      .filter(([, source]) => {
        if (!source || typeof source !== 'object') return false;
        const s = source as { type?: string; url?: string };
        return (
          s.type === 'vector' &&
          typeof s.url === 'string' &&
          s.url.includes('mapbox.mapbox-landmark-pois-v1')
        );
      })
      .map(([sourceId]) => sourceId);

    if (blockedSourceIds.length === 0) return;
    const layers = style.layers ?? [];
    for (const layer of layers) {
      if (blockedSourceIds.includes(layer.source ?? '')) {
        try {
          map.removeLayer(layer.id);
        } catch {
          // ignore
        }
      }
    }
    for (const sourceId of blockedSourceIds) {
      try {
        map.removeSource(sourceId);
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore if style/sources not ready
  }
}

/** Activa o desactiva edificios y objetos 3D en estilo FLOWYA (Mapbox Studio). */
export function set3DBuildingsEnabled(map: MapboxMap, enabled: boolean): void {
  try {
    map.setConfigProperty('basemap', 'show3dBuildings', enabled);
    map.setConfigProperty('basemap', 'show3dObjects', enabled);
  } catch {
    // ignore if style has no basemap
  }
}

/** Activa/desactiva iconos y labels de landmarks en estilo FLOWYA (Mapbox Studio). */
export function setLandmarkLabelsEnabled(map: MapboxMap, enabled: boolean): void {
  try {
    map.setConfigProperty('basemap', 'showLandmarkIcons', enabled);
    map.setConfigProperty('basemap', 'showLandmarkIconLabels', enabled);
  } catch {
    // ignore if style has no basemap import
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
  onCoords: (coords: UserCoords) => void,
  shouldCenter: () => boolean = () => true,
): void {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const coords = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      };
      onCoords(coords);
      if (!shouldCenter()) return;
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
